/**
 * Firebase Cloud Functions for HubSpot Integration
 * 
 * Features:
 * 1. Webhook Listener - Receives real-time updates from HubSpot
 * 2. Initial Bulk Sync - One-time sync of all contacts
 * 3. Incremental Updates - Keeps Firestore in sync with HubSpot
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const axios = require('axios');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Configuration
const WEBHOOK_SECRET = process.env.HUBSPOT_WEBHOOK_SECRET || 'your-webhook-secret-here';
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY || '';

/**
 * ============================================================
 * WEBHOOK LISTENER - Real-time HubSpot Updates
 * ============================================================
 * 
 * Receives POST requests from HubSpot webhooks for:
 * - contact.propertyChange
 * - deal.creation
 * - deal.propertyChange
 * - contact.creation
 * 
 * Features:
 * - Validates HubSpot signature for security
 * - Updates Firestore in real-time
 * - Handles multiple events in a single request
 * - Logs all activities for debugging
 */
exports.hubspotWebhook = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-HubSpot-Signature');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.warn('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('Received webhook request from HubSpot');
    console.log('Headers:', JSON.stringify(req.headers));
    
    // Validate HubSpot signature
    const signature = req.headers['x-hubspot-signature'];
    const isValid = validateHubSpotSignature(req.body, signature);
    
    if (!isValid && WEBHOOK_SECRET !== 'your-webhook-secret-here') {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse webhook payload
    const events = Array.isArray(req.body) ? req.body : [req.body];
    console.log(`Processing ${events.length} webhook event(s)`);

    const results = [];
    const db = admin.firestore();

    // Process each event
    for (const event of events) {
      try {
        console.log('Processing event:', JSON.stringify(event));
        
        const eventType = event.subscriptionType || event.eventType;
        const objectId = event.objectId?.toString();
        const occurredAt = event.occurredAt ? new Date(event.occurredAt) : new Date();

        if (!objectId) {
          console.warn('Event missing objectId, skipping');
          results.push({ success: false, error: 'Missing objectId' });
          continue;
        }

        // Route to appropriate handler based on event type
        if (eventType.includes('contact')) {
          await handleContactEvent(db, event, objectId, occurredAt);
          results.push({ success: true, objectId, type: 'contact' });
        } else if (eventType.includes('deal')) {
          await handleDealEvent(db, event, objectId, occurredAt);
          results.push({ success: true, objectId, type: 'deal' });
        } else {
          console.warn('Unsupported event type:', eventType);
          results.push({ success: false, error: 'Unsupported event type', type: eventType });
        }

      } catch (eventError) {
        console.error('Error processing event:', eventError);
        results.push({ success: false, error: eventError.message });
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      eventsProcessed: events.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Handle Contact Events (creation, property changes)
 */
async function handleContactEvent(db, event, objectId, occurredAt) {
  console.log(`Handling contact event for ID: ${objectId}`);
  
  const contactRef = db.collection('hubspot_contacts').doc(objectId);
  
  // If properties are included in webhook, use them directly
  if (event.properties) {
    const contactData = mapContactProperties(event.properties, objectId);
    contactData.lastWebhookUpdate = occurredAt;
    contactData.webhookEventType = event.subscriptionType || event.eventType;
    
    await contactRef.set(contactData, { merge: true });
    console.log(`Contact ${objectId} updated from webhook data`);
  } 
  // Otherwise, fetch full contact data from HubSpot API
  else if (HUBSPOT_API_KEY) {
    try {
      const contactData = await fetchContactFromHubSpot(objectId);
      contactData.lastWebhookUpdate = occurredAt;
      contactData.webhookEventType = event.subscriptionType || event.eventType;
      
      await contactRef.set(contactData, { merge: true });
      console.log(`Contact ${objectId} fetched and updated from HubSpot API`);
    } catch (apiError) {
      console.error('Error fetching contact from HubSpot:', apiError);
      // Still update timestamp even if API fetch fails
      await contactRef.set({
        lastWebhookUpdate: occurredAt,
        webhookEventType: event.subscriptionType || event.eventType,
        hsObjectId: objectId
      }, { merge: true });
    }
  }
  // Minimal update if no data available
  else {
    await contactRef.set({
      lastWebhookUpdate: occurredAt,
      webhookEventType: event.subscriptionType || event.eventType,
      hsObjectId: objectId
    }, { merge: true });
    console.log(`Contact ${objectId} timestamp updated (no API key configured)`);
  }
}

/**
 * Handle Deal Events (creation, property changes)
 */
async function handleDealEvent(db, event, objectId, occurredAt) {
  console.log(`Handling deal event for ID: ${objectId}`);
  
  const dealRef = db.collection('hubspot_deals').doc(objectId);
  
  // If properties are included in webhook, use them directly
  if (event.properties) {
    const dealData = mapDealProperties(event.properties, objectId);
    dealData.lastWebhookUpdate = occurredAt;
    dealData.webhookEventType = event.subscriptionType || event.eventType;
    
    await dealRef.set(dealData, { merge: true });
    console.log(`Deal ${objectId} updated from webhook data`);
  }
  // Otherwise, fetch full deal data from HubSpot API
  else if (HUBSPOT_API_KEY) {
    try {
      const dealData = await fetchDealFromHubSpot(objectId);
      dealData.lastWebhookUpdate = occurredAt;
      dealData.webhookEventType = event.subscriptionType || event.eventType;
      
      await dealRef.set(dealData, { merge: true });
      console.log(`Deal ${objectId} fetched and updated from HubSpot API`);
    } catch (apiError) {
      console.error('Error fetching deal from HubSpot:', apiError);
      // Still update timestamp even if API fetch fails
      await dealRef.set({
        lastWebhookUpdate: occurredAt,
        webhookEventType: event.subscriptionType || event.eventType,
        hsObjectId: objectId
      }, { merge: true });
    }
  }
  // Minimal update if no data available
  else {
    await dealRef.set({
      lastWebhookUpdate: occurredAt,
      webhookEventType: event.subscriptionType || event.eventType,
      hsObjectId: objectId
    }, { merge: true });
    console.log(`Deal ${objectId} timestamp updated (no API key configured)`);
  }
}

/**
 * Map HubSpot contact properties to Firestore schema
 */
function mapContactProperties(properties, objectId) {
  return {
    hsObjectId: objectId,
    firstName: properties.firstname || '',
    lastName: properties.lastname || '',
    email: properties.email || '',
    phone: properties.phone || '',
    company: properties.company || '',
    jobTitle: properties.jobtitle || '',
    city: properties.city || '',
    state: properties.state || '',
    country: properties.country || '',
    lifecycleStage: properties.lifecyclestage || '',
    createdAt: properties.createdate ? new Date(properties.createdate) : admin.firestore.FieldValue.serverTimestamp(),
    lastModifiedAt: properties.lastmodifieddate ? new Date(properties.lastmodifieddate) : admin.firestore.FieldValue.serverTimestamp(),
    syncedAt: admin.firestore.FieldValue.serverTimestamp(),
    syncSource: 'webhook'
  };
}

/**
 * Map HubSpot deal properties to Firestore schema
 */
function mapDealProperties(properties, objectId) {
  return {
    hsObjectId: objectId,
    dealName: properties.dealname || '',
    amount: properties.amount ? parseFloat(properties.amount) : 0,
    dealStage: properties.dealstage || '',
    pipeline: properties.pipeline || '',
    closeDate: properties.closedate ? new Date(properties.closedate) : null,
    dealType: properties.dealtype || '',
    priority: properties.hs_priority || '',
    description: properties.description || '',
    createdAt: properties.createdate ? new Date(properties.createdate) : admin.firestore.FieldValue.serverTimestamp(),
    lastModifiedAt: properties.hs_lastmodifieddate ? new Date(properties.hs_lastmodifieddate) : admin.firestore.FieldValue.serverTimestamp(),
    syncedAt: admin.firestore.FieldValue.serverTimestamp(),
    syncSource: 'webhook'
  };
}

/**
 * Fetch contact data from HubSpot API
 */
async function fetchContactFromHubSpot(contactId) {
  const response = await axios.get(
    `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
    {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        properties: 'firstname,lastname,email,phone,company,jobtitle,city,state,country,lifecyclestage,createdate,lastmodifieddate'
      }
    }
  );

  return mapContactProperties(response.data.properties, contactId);
}

/**
 * Fetch deal data from HubSpot API
 */
async function fetchDealFromHubSpot(dealId) {
  const response = await axios.get(
    `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`,
    {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        properties: 'dealname,amount,dealstage,pipeline,closedate,dealtype,hs_priority,description,createdate,hs_lastmodifieddate'
      }
    }
  );

  return mapDealProperties(response.data.properties, dealId);
}

/**
 * Validate HubSpot webhook signature for security
 */
function validateHubSpotSignature(body, signature) {
  if (!signature || !WEBHOOK_SECRET || WEBHOOK_SECRET === 'your-webhook-secret-here') {
    console.warn('Signature validation skipped - no secret configured');
    return true; // Skip validation if no secret is set
  }

  try {
    const requestBody = typeof body === 'string' ? body : JSON.stringify(body);
    const hash = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(requestBody)
      .digest('hex');

    const isValid = hash === signature;
    console.log('Signature validation:', isValid ? 'PASSED' : 'FAILED');
    return isValid;
  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
}

/**
 * ============================================================
 * INITIAL BULK SYNC - One-time Contact Sync
 * ============================================================
 */
exports.initialBulkSync = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { hubspotApiKey } = req.body;

    if (!hubspotApiKey) {
      return res.status(400).json({ error: 'Missing required parameter: hubspotApiKey' });
    }

    console.log('Starting HubSpot contacts bulk sync...');

    let totalContactsSynced = 0;
    let totalPages = 0;
    let hasMore = true;
    let after = undefined;
    const startTime = Date.now();

    const HUBSPOT_API_URL = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
    const BATCH_SIZE = 100;
    const FIRESTORE_BATCH_LIMIT = 500;

    const propertiesToFetch = [
      'firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle',
      'city', 'state', 'country', 'lifecyclestage', 'createdate',
      'lastmodifieddate', 'hs_object_id'
    ];

    const db = admin.firestore();
    const contactsCollection = db.collection('hubspot_contacts');

    let firestoreBatch = db.batch();
    let batchOperationCount = 0;

    while (hasMore) {
      try {
        const searchPayload = {
          limit: BATCH_SIZE,
          properties: propertiesToFetch,
          sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }]
        };

        if (after) searchPayload.after = after;

        console.log(`Fetching page ${totalPages + 1} from HubSpot...`);

        const response = await axios.post(HUBSPOT_API_URL, searchPayload, {
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        const { results, paging } = response.data;
        console.log(`Received ${results.length} contacts from HubSpot`);

        for (const contact of results) {
          const hsObjectId = contact.id;
          const contactData = mapContactProperties(contact.properties, hsObjectId);
          contactData.syncSource = 'initialBulkSync';

          const docRef = contactsCollection.doc(hsObjectId);
          firestoreBatch.set(docRef, contactData, { merge: true });
          batchOperationCount++;
          totalContactsSynced++;

          if (batchOperationCount >= FIRESTORE_BATCH_LIMIT) {
            console.log(`Committing batch of ${batchOperationCount} contacts...`);
            await firestoreBatch.commit();
            firestoreBatch = db.batch();
            batchOperationCount = 0;
            console.log(`Successfully committed. Total synced: ${totalContactsSynced}`);
          }
        }

        totalPages++;

        if (paging && paging.next && paging.next.after) {
          after = paging.next.after;
          hasMore = true;
        } else {
          hasMore = false;
        }

        if (hasMore) await new Promise(resolve => setTimeout(resolve, 100));

      } catch (pageError) {
        console.error(`Error fetching page ${totalPages + 1}:`, pageError.message);
        
        if (pageError.response && pageError.response.status === 429) {
          console.log('Rate limit hit, waiting 10 seconds...');
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }
        
        throw pageError;
      }
    }

    if (batchOperationCount > 0) {
      console.log(`Committing final batch of ${batchOperationCount} contacts...`);
      await firestoreBatch.commit();
    }

    const endTime = Date.now();
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

    const result = {
      success: true,
      message: 'HubSpot contacts successfully synced to Firestore',
      statistics: {
        totalContactsSynced,
        totalPages,
        durationSeconds,
        averageContactsPerPage: Math.round(totalContactsSynced / totalPages),
        timestamp: new Date().toISOString()
      }
    };

    console.log('Bulk sync completed:', result);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in initialBulkSync:', error);
    
    let statusCode = 500;
    let errorMessage = error.message;

    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || error.message;
      
      if (statusCode === 401) errorMessage = 'Invalid HubSpot API key';
      else if (statusCode === 403) errorMessage = 'Access forbidden. Check API permissions';
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.response?.data || null
    });
  }
});

/**
 * ============================================================
 * GET SYNC STATUS
 * ============================================================
 */
exports.getSyncStatus = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  try {
    const db = admin.firestore();
    
    const contactsSnapshot = await db.collection('hubspot_contacts').count().get();
    const totalContacts = contactsSnapshot.data().count;

    const dealsSnapshot = await db.collection('hubspot_deals').count().get();
    const totalDeals = dealsSnapshot.data().count;

    const latestContact = await db.collection('hubspot_contacts')
      .orderBy('syncedAt', 'desc')
      .limit(1)
      .get();

    const latestDeal = await db.collection('hubspot_deals')
      .orderBy('syncedAt', 'desc')
      .limit(1)
      .get();

    const latestContactSync = latestContact.empty ? null : latestContact.docs[0].data().syncedAt.toDate();
    const latestDealSync = latestDeal.empty ? null : latestDeal.docs[0].data().syncedAt.toDate();

    return res.status(200).json({
      success: true,
      contacts: {
        total: totalContacts,
        lastSyncedAt: latestContactSync,
        collection: 'hubspot_contacts'
      },
      deals: {
        total: totalDeals,
        lastSyncedAt: latestDealSync,
        collection: 'hubspot_deals'
      }
    });

  } catch (error) {
    console.error('Error getting sync status:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});