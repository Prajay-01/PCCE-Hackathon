import axios from 'axios';
import firestore from '@react-native-firebase/firestore';

// IMPORTANT: Replace with your YouTube Data API Key
// Get it from: https://console.cloud.google.com/apis/credentials
const YOUTUBE_API_KEY = 'AIzaSyBsJPK6vAjtw_AbYO7-Unq1Aq47HVUhnKQ';

/**
 * Fetches YouTube channel data and syncs it to Firestore.
 * @param {string} userId - The Firebase user ID to associate the data with.
 * @param {string} channelId - The YouTube channel ID (starts with 'UC...')
 * @returns {Promise<object>} - A summary of the synced data.
 */
export const syncYouTubeData = async (userId, channelId) => {
  if (!userId) {
    throw new Error('User ID is required to sync YouTube data.');
  }

  if (!channelId) {
    throw new Error('YouTube Channel ID is required. Find it in your YouTube Studio.');
  }

  if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    console.log('YouTube API key not configured. Using sample data.');
    return await createSampleYouTubeData(userId, channelId);
  }

  try {
    console.log('Starting YouTube data sync for channel:', channelId);

    // 1. Fetch channel statistics
    const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        key: YOUTUBE_API_KEY,
        id: channelId,
        part: 'snippet,statistics,contentDetails'
      },
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('YouTube channel not found. Please check your channel ID.');
    }

    const channel = channelResponse.data.items[0];
    const stats = channel.statistics;
    const snippet = channel.snippet;

    console.log(`Found YouTube channel: ${snippet.title}`);

    // 2. Fetch recent videos from the uploads playlist
    let videos = [];
    let videoStats = [];
    
    try {
      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        console.log('No uploads playlist found, using sample data');
        return await createSampleYouTubeData(userId, channelId);
      }
      
      const videosResponse = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: {
          key: YOUTUBE_API_KEY,
          playlistId: uploadsPlaylistId,
          part: 'snippet,contentDetails',
          maxResults: 25
        },
      });

      videos = videosResponse.data.items || [];
      console.log(`Fetched ${videos.length} videos from YouTube channel`);

      // 3. Fetch detailed statistics for each video
      const videoIds = videos.map(v => v.contentDetails.videoId).join(',');
      
      if (videoIds) {
        const videoStatsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: {
            key: YOUTUBE_API_KEY,
            id: videoIds,
            part: 'statistics,contentDetails'
          },
        });
        videoStats = videoStatsResponse.data.items || [];
      }
    } catch (playlistError) {
      console.log('Error fetching playlist, using channel stats only:', playlistError.message);
      // Continue with just channel stats, no videos
    }

    // 4. Process videos data
    let totalViews = parseInt(stats.viewCount || 0);
    let totalEngagements = 0;

    const topVideos = videos
      .map((video, index) => {
        const videoId = video.contentDetails?.videoId;
        if (!videoId) return null;
        
        const videoStat = videoStats.find(v => v.id === videoId);
        
        const views = parseInt(videoStat?.statistics?.viewCount || 0);
        const likes = parseInt(videoStat?.statistics?.likeCount || 0);
        const comments = parseInt(videoStat?.statistics?.commentCount || 0);
        const engagement = likes + comments;
        
        totalEngagements += engagement;

        return {
          id: videoId,
          caption: video.snippet?.title || 'Video',
          timestamp: video.snippet?.publishedAt,
          imageUrl: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url,
          permalink: `https://www.youtube.com/watch?v=${videoId}`,
          views: views,
          likes: likes,
          comments: comments,
          engagement: engagement,
          impressions: views, // For YouTube, views = impressions
          engagementRate: views > 0 ? ((engagement / views) * 100).toFixed(2) : 0,
        };
      })
      .filter(v => v !== null) // Remove null entries
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // 5. Format the data for Firestore
    const analyticsPayload = {
      userId: userId,
      platform: 'youtube',
      channelId: channelId,
      channelName: snippet.title,
      impressions: totalViews,
      engagement: totalEngagements,
      followers: parseInt(stats.subscriberCount || 0),
      posts: parseInt(stats.videoCount || 0),
      topPosts: topVideos,
      lastUpdated: firestore.FieldValue.serverTimestamp(),
    };

    // 6. Save the data to Firestore
    const docRef = firestore().collection('analytics').doc(`${userId}_youtube`);
    await docRef.set(analyticsPayload, { merge: true });

    // 7. Also save the connected account info
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('socialAccounts')
      .doc('youtube')
      .set({
        platform: 'youtube',
        connected: true,
        connectedAt: firestore.FieldValue.serverTimestamp(),
        username: snippet.title,
        channelId: channelId,
      }, { merge: true });

    console.log('Successfully synced YouTube data to Firestore.');

    return {
      success: true,
      message: 'YouTube data synced successfully!',
      channelName: snippet.title,
      syncedVideos: videos.length,
      totalViews,
      totalEngagements,
      subscribers: parseInt(stats.subscriberCount || 0),
    };

  } catch (error) {
    console.error('Error syncing YouTube data:', error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.error?.message || error.message;
    throw new Error(`Failed to sync YouTube data: ${errorMessage}`);
  }
};

/**
 * Creates sample YouTube data for demonstration when API key is not configured
 */
const createSampleYouTubeData = async (userId, channelId) => {
  console.log('Creating sample YouTube data for demonstration...');

  const sampleVideos = [
    {
      id: 'sample_yt_1',
      caption: '10 Tips for Growing Your YouTube Channel in 2025 🚀',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      permalink: 'https://youtube.com',
      views: 15420,
      likes: 892,
      comments: 127,
      engagement: 1019,
      impressions: 15420,
      engagementRate: 6.61,
    },
    {
      id: 'sample_yt_2',
      caption: 'My Content Creation Setup Tour | Behind the Scenes',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      permalink: 'https://youtube.com',
      views: 12350,
      likes: 745,
      comments: 98,
      engagement: 843,
      impressions: 12350,
      engagementRate: 6.82,
    },
    {
      id: 'sample_yt_3',
      caption: 'How I Edited This Video in 30 Minutes | Tutorial',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      permalink: 'https://youtube.com',
      views: 23100,
      likes: 1456,
      comments: 234,
      engagement: 1690,
      impressions: 23100,
      engagementRate: 7.32,
    },
    {
      id: 'sample_yt_4',
      caption: 'Q&A: Your Questions About Content Growth Answered',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      permalink: 'https://youtube.com',
      views: 9870,
      likes: 567,
      comments: 156,
      engagement: 723,
      impressions: 9870,
      engagementRate: 7.32,
    },
    {
      id: 'sample_yt_5',
      caption: 'The BEST Time to Post on Social Media (Data-Driven)',
      timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      permalink: 'https://youtube.com',
      views: 18900,
      likes: 1123,
      comments: 189,
      engagement: 1312,
      impressions: 18900,
      engagementRate: 6.94,
    },
  ];

  const totalViews = sampleVideos.reduce((sum, v) => sum + v.views, 0);
  const totalEngagements = sampleVideos.reduce((sum, v) => sum + v.engagement, 0);
  const subscribers = 45800;
  const channelName = 'Your YouTube Channel';

  const analyticsPayload = {
    userId: userId,
    platform: 'youtube',
    channelId: channelId || 'demo_channel',
    channelName: channelName,
    impressions: totalViews,
    engagement: totalEngagements,
    followers: subscribers,
    posts: sampleVideos.length,
    topPosts: sampleVideos,
    isSampleData: true,
    lastUpdated: firestore.FieldValue.serverTimestamp(),
  };

  const docRef = firestore().collection('analytics').doc(`${userId}_youtube`);
  await docRef.set(analyticsPayload, { merge: true });

  await firestore()
    .collection('users')
    .doc(userId)
    .collection('socialAccounts')
    .doc('youtube')
    .set({
      platform: 'youtube',
      connected: true,
      connectedAt: firestore.FieldValue.serverTimestamp(),
      username: channelName,
      channelId: channelId || 'demo_channel',
      isSampleData: true,
    }, { merge: true });

  console.log('Successfully created sample YouTube data');

  return {
    success: true,
    message: 'Sample YouTube data created successfully! (Demo mode - add your YouTube API key for real data)',
    channelName: channelName,
    syncedVideos: sampleVideos.length,
    totalViews,
    totalEngagements,
    subscribers: subscribers,
  };
};

/**
 * Helper function to get YouTube channel ID from a channel URL or handle
 */
export const getChannelIdFromUrl = async (urlOrHandle) => {
  // If it's already a channel ID (starts with UC), return it
  if (urlOrHandle.startsWith('UC') && urlOrHandle.length === 24) {
    return urlOrHandle;
  }

  // Extract from URL patterns
  const patterns = [
    /youtube\.com\/channel\/(UC[\w-]{22})/,
    /youtube\.com\/c\/([\w-]+)/,
    /youtube\.com\/@([\w-]+)/,
    /youtube\.com\/user\/([\w-]+)/,
  ];

  for (const pattern of patterns) {
    const match = urlOrHandle.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return urlOrHandle; // Return as-is if no pattern matches
};
