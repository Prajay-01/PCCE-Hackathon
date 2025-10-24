import { firestore } from './authService';

// Social Media Platform Configuration
export const PLATFORMS = {
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  YOUTUBE: 'youtube'
};

// Save social media connection to Firestore
export const connectSocialAccount = async (userId, platform, credentials) => {
  try {
    await firestore().collection('users').doc(userId).collection('socialAccounts').doc(platform).set({
      platform,
      connected: true,
      connectedAt: firestore.FieldValue.serverTimestamp(),
      username: credentials.username,
      accessToken: credentials.accessToken, // In production, encrypt this!
      refreshToken: credentials.refreshToken,
      expiresAt: credentials.expiresAt,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error connecting social account:', error);
    return { success: false, error: error.message };
  }
};

// Get connected social accounts with timeout
export const getConnectedAccounts = async (userId, timeoutMs = 2000) => {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    );

    // Create the query promise
    const queryPromise = firestore()
      .collection('users')
      .doc(userId)
      .collection('socialAccounts')
      .where('connected', '==', true)
      .get();

    // Race between timeout and query
    const snapshot = await Promise.race([queryPromise, timeoutPromise]);
    
    const accounts = [];
    snapshot.forEach(doc => {
      accounts.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('getConnectedAccounts: Found', accounts.length, 'accounts');
    return { success: true, accounts };
  } catch (error) {
    console.error('Error fetching connected accounts:', error.message);
    return { success: false, error: error.message, accounts: [] };
  }
};

// Disconnect social account
export const disconnectSocialAccount = async (userId, platform) => {
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('socialAccounts')
      .doc(platform)
      .delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return { success: false, error: error.message };
  }
};

// Fetch Instagram Analytics
export const fetchInstagramAnalytics = async (accessToken) => {
  try {
    // Instagram Graph API endpoint
    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Instagram data');
    }
    
    const userData = await response.json();
    
    // Fetch media insights
    const mediaResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}`
    );
    
    const mediaData = await mediaResponse.json();
    
    return {
      success: true,
      data: {
        username: userData.username,
        mediaCount: userData.media_count,
        posts: mediaData.data || []
      }
    };
  } catch (error) {
    console.error('Instagram API Error:', error);
    return { success: false, error: error.message };
  }
};

// Fetch Twitter Analytics
export const fetchTwitterAnalytics = async (accessToken) => {
  try {
    // Twitter API v2 endpoint
    const response = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=public_metrics,created_at',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Twitter data');
    }
    
    const userData = await response.json();
    
    // Fetch recent tweets
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${userData.data.id}/tweets?tweet.fields=public_metrics,created_at&max_results=10`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const tweetsData = await tweetsResponse.json();
    
    return {
      success: true,
      data: {
        username: userData.data.username,
        followers: userData.data.public_metrics.followers_count,
        following: userData.data.public_metrics.following_count,
        tweets: tweetsData.data || []
      }
    };
  } catch (error) {
    console.error('Twitter API Error:', error);
    return { success: false, error: error.message };
  }
};

// Save analytics to Firestore
export const saveAnalyticsData = async (userId, platform, analyticsData) => {
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('analytics')
      .doc(platform)
      .set({
        platform,
        data: analyticsData,
        lastUpdated: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving analytics:', error);
    return { success: false, error: error.message };
  }
};

// Fetch all analytics for user
export const fetchUserAnalytics = async (userId, timeoutMs = 2000) => {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    );

    // Create the query promise
    const queryPromise = firestore()
      .collection('analytics')
      .where('userId', '==', userId)
      .get();

    // Race between timeout and query
    const snapshot = await Promise.race([queryPromise, timeoutPromise]);
    
    const analytics = [];
    snapshot.forEach(doc => {
      analytics.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('fetchUserAnalytics: Found', analytics.length, 'analytics records');
    return { success: true, analytics };
  } catch (error) {
    console.error('Error fetching analytics:', error.message);
    return { success: false, error: error.message, analytics: [] };
  }
};

// Calculate engagement rate
export const calculateEngagementRate = (likes, comments, followers) => {
  if (followers === 0) return 0;
  return (((likes + comments) / followers) * 100).toFixed(2);
};

// Analyze posting patterns
export const analyzeBestPostingTimes = (posts) => {
  const hourCounts = {};
  const dayCount = {};
  
  posts.forEach(post => {
    const date = new Date(post.timestamp || post.created_at);
    const hour = date.getHours();
    const day = date.getDay();
    
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCount[day] = (dayCount[day] || 0) + 1;
  });
  
  // Find top 3 hours
  const topHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
  
  // Find top day
  const topDay = Object.entries(dayCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    bestHours: topHours,
    bestDay: days[parseInt(topDay)] || 'Monday'
  };
};

// Generate growth insights
export const generateGrowthInsights = (currentData, previousData) => {
  const insights = [];
  
  if (currentData.followers && previousData.followers) {
    const growth = ((currentData.followers - previousData.followers) / previousData.followers * 100).toFixed(1);
    insights.push({
      type: 'follower_growth',
      message: `Your followers ${growth > 0 ? 'grew' : 'decreased'} by ${Math.abs(growth)}% this period`,
      growth: parseFloat(growth)
    });
  }
  
  if (currentData.engagement && previousData.engagement) {
    const engagementChange = (currentData.engagement - previousData.engagement).toFixed(1);
    insights.push({
      type: 'engagement',
      message: `Engagement rate ${engagementChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(engagementChange)}%`,
      change: parseFloat(engagementChange)
    });
  }
  
  return insights;
};
