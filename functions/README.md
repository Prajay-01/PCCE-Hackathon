# Firebase Cloud Functions - HubSpot Integration

Complete integration for syncing HubSpot data to Firestore with both **bulk sync** and **real-time webhooks**.

## 📁 Files

- **`index.js`** - All Cloud Functions (bulk sync + webhook listener)
- **`package.json`** - Dependencies and scripts
- **`HUBSPOT_SYNC_GUIDE.md`** - Initial bulk sync documentation
- **`WEBHOOK_SETUP_GUIDE.md`** - Real-time webhook setup guide
- **`DEPLOYMENT_CHECKLIST.md`** - Deployment steps
- **`examples.js`** - Usage examples and test code
- **`test-webhook.js`** - Webhook testing script

## 🚀 Quick Start

### Option A: Real-time Webhooks (Recommended)

**Step 1:** Deploy the webhook function
```bash
cd functions
npm install
firebase deploy --only functions:hubspotWebhook
```

**Step 2:** Configure environment variables
```bash
firebase functions:config:set hubspot.webhook_secret="YOUR_SECRET_HERE"
firebase functions:config:set hubspot.api_key="YOUR_HUBSPOT_API_KEY"
firebase deploy --only functions
```

**Step 3:** Set up HubSpot webhooks
See **`WEBHOOK_SETUP_GUIDE.md`** for detailed instructions.

**Step 4:** Test the webhook
```bash
node test-webhook.js https://[region]-[project-id].cloudfunctions.net/hubspotWebhook
```

### Option B: Initial Bulk Sync

**Step 1:** Deploy the function
```bash
firebase deploy --only functions:initialBulkSync
```

**Step 2:** Run the sync
```bash
curl -X POST \
  https://[region]-[project-id].cloudfunctions.net/initialBulkSync \
  -H "Content-Type: application/json" \
  -d '{"hubspotApiKey": "YOUR_HUBSPOT_API_KEY"}'
```

**Step 3:** Check sync status
```bash
curl https://[region]-[project-id].cloudfunctions.net/getSyncStatus
```

## 📊 Functions Available

### 1. `hubspotWebhook` (POST) 🆕
**Real-time webhook listener** for HubSpot events.

**Endpoint:** `POST /hubspotWebhook`

**Supported Events:**
- `contact.creation` - New contact created
- `contact.propertyChange` - Contact updated
- `deal.creation` - New deal created
- `deal.propertyChange` - Deal updated

**Features:**
- ✅ Signature validation for security
- ✅ Batch event processing
- ✅ Automatic Firestore updates
- ✅ Error handling and logging

**HubSpot Payload Example:**
```json
[
  {
    "objectId": 12345,
    "subscriptionType": "contact.propertyChange",
    "occurredAt": 1234567890123,
    "properties": {
      "firstname": "John",
      "lastname": "Doe",
      "email": "john.doe@example.com"
    }
  }
]
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "eventsProcessed": 1,
  "results": [
    {
      "success": true,
      "objectId": "12345",
      "type": "contact"
    }
  ],
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### 2. `initialBulkSync` (POST)
**One-time bulk sync** of all HubSpot contacts to Firestore.

**Endpoint:** `POST /initialBulkSync`

**Body:**
```json
{
  "hubspotApiKey": "pat-na1-xxxx..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "HubSpot contacts successfully synced to Firestore",
  "statistics": {
    "totalContactsSynced": 1523,
    "totalPages": 16,
    "durationSeconds": "45.32",
    "averageContactsPerPage": 95,
    "timestamp": "2025-10-23T10:30:45.123Z"
  }
}
```

### 3. `getSyncStatus` (GET)
Returns current Firestore sync statistics for both contacts and deals.

**Endpoint:** `GET /getSyncStatus`

**Response:**
```json
{
  "success": true,
  "contacts": {
    "total": 1523,
    "lastSyncedAt": "2024-01-15T10:30:45.000Z",
    "collection": "hubspot_contacts"
  },
  "deals": {
    "total": 87,
    "lastSyncedAt": "2024-01-15T10:28:12.000Z",
    "collection": "hubspot_deals"
  }
}
```

## 🔑 Getting HubSpot API Key

1. Go to **HubSpot Settings** → **Integrations** → **Private Apps**
2. Click **"Create a private app"**
3. Name it "Firestore Sync"
4. Add scope: `crm.objects.contacts.read`
5. Click **"Create app"**
6. Copy the access token

## 📚 Full Documentation

See **`HUBSPOT_SYNC_GUIDE.md`** for:
- Detailed API documentation
- Error handling
- Performance optimization
- Testing procedures
- Production considerations

## 🧪 Testing

Run examples:

```bash
node examples.js
```

Or use the provided React Native/JavaScript examples in `examples.js`.

## 🛠️ Tech Stack

- **Firebase Cloud Functions** - Serverless execution
- **Firebase Admin SDK** - Firestore access
- **Axios** - HTTP requests to HubSpot
- **HubSpot CRM API v3** - Contact data source

## 📦 Firestore Structure

### Collections

#### `hubspot_contacts/`
```javascript
{
  hsObjectId: "123456",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1-555-0100",
  company: "Acme Corp",
  jobTitle: "CEO",
  city: "San Francisco",
  state: "CA",
  country: "United States",
  lifecycleStage: "customer",
  createdAt: Timestamp,
  lastModifiedAt: Timestamp,
  syncedAt: Timestamp,
  syncSource: "webhook" | "initialBulkSync",
  lastWebhookUpdate: Timestamp,  // Only for webhook updates
  webhookEventType: "contact.propertyChange"  // Only for webhook updates
}
```

#### `hubspot_deals/`
```javascript
{
  hsObjectId: "789012",
  dealName: "Q1 Enterprise Contract",
  amount: 50000,
  dealStage: "closedwon",
  pipeline: "default",
  closeDate: Timestamp,
  dealType: "newbusiness",
  priority: "high",
  description: "Enterprise deal for 500 users",
  createdAt: Timestamp,
  lastModifiedAt: Timestamp,
  syncedAt: Timestamp,
  syncSource: "webhook" | "initialBulkSync",
  lastWebhookUpdate: Timestamp,  // Only for webhook updates
  webhookEventType: "deal.creation"  // Only for webhook updates
}
```

## ⚡ Performance

- **Batch Size:** 500 Firestore operations per batch
- **Pagination:** 100 HubSpot contacts per request
- **Rate Limiting:** Automatic retry on 429 errors
- **Average Speed:** ~200 contacts/second

## 🔐 Security

- API keys passed via request body (not hardcoded)
- CORS enabled for client-side calls
- Firebase security rules apply to Firestore
- Use environment variables in production

## 📝 License

Part of Content Growth Assistant project.

---

**Questions?** Check `HUBSPOT_SYNC_GUIDE.md` or the code comments in `index.js`.
