# YouTube Data API Setup Guide

This guide will help you fetch real YouTube data for your channel.

## 📋 Prerequisites

- A YouTube channel
- A Google Cloud Platform account (free)

---

## 🔧 Step 1: Get Your YouTube Channel ID

### Method 1: From YouTube Studio
1. Go to [YouTube Studio](https://studio.youtube.com)
2. Click **Settings** (gear icon)
3. Click **Channel** → **Advanced settings**
4. Copy your **Channel ID** (starts with `UC...`)

### Method 2: From Your Channel URL
1. Go to your YouTube channel
2. Look at the URL:
   - If it's `youtube.com/channel/UC...`, the part after `/channel/` is your Channel ID
   - If it's `youtube.com/@username`, you'll need Method 1

**Example Channel ID:** `UCuAXFkgsw1L7xaCfnd5JJOw`

---

## 🔑 Step 2: Create YouTube Data API Key

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com

### 2. Create a New Project
1. Click the project dropdown at the top
2. Click **"New Project"**
3. Enter project name: `ContentGrowthAssistant`
4. Click **Create**

### 3. Enable YouTube Data API v3
1. In the search bar, type: **YouTube Data API v3**
2. Click on **YouTube Data API v3**
3. Click **Enable**

### 4. Create API Credentials
1. Click **"Create Credentials"** button
2. Select:
   - **Which API are you using?** → YouTube Data API v3
   - **What data will you be accessing?** → Public data
3. Click **"What credentials do I need?"**
4. Your API key will be generated

### 5. Copy Your API Key
Copy the API key that looks like this:
```
AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📱 Step 3: Add API Key to Your App

1. Open the file:
```
src/services/youtubeService.js
```

2. Find this line at the top:
```javascript
const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY_HERE';
```

3. Replace it with your actual API key:
```javascript
const YOUTUBE_API_KEY = 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

---

## ✅ Step 4: Sync Your YouTube Data

1. **Open your app** and go to the **Profile** screen
2. Tap **"Sync YouTube"** button
3. Enter your **Channel ID** (from Step 1)
4. Wait for the sync to complete

You'll see:
- Channel name
- Number of videos synced
- Total subscribers
- Total views
- Engagement data

---

## 📊 What Data is Fetched?

The YouTube service fetches:

- ✅ **Channel Statistics**
  - Subscriber count
  - Total video count
  - Total views

- ✅ **Recent Videos (Last 25)**
  - Title
  - Thumbnail
  - Views
  - Likes
  - Comments
  - Engagement rate

- ✅ **Top Performing Videos**
  - Sorted by engagement
  - Top 5 videos displayed

---

## 🔒 API Quota Limits

YouTube Data API has daily quota limits:

- **Free tier**: 10,000 units/day
- **Each sync uses**: ~100-200 units
- **You can sync**: ~50-100 times per day

### Tips to Stay Within Quota:
- Don't sync too frequently (once per day is enough)
- Use the sample data mode for testing

---

## 🧪 Demo Mode (No API Key Needed)

If you don't want to set up the API key yet, the app will automatically use **sample YouTube data** for demonstration.

To enable demo mode:
- Leave the API key as `'YOUR_YOUTUBE_API_KEY_HERE'`
- The app will create realistic sample data

---

## 🐛 Troubleshooting

### Error: "YouTube channel not found"
- ✅ Double-check your Channel ID
- ✅ Make sure it starts with `UC`
- ✅ Make sure the channel is public

### Error: "API key not valid"
- ✅ Make sure you copied the entire API key
- ✅ Check that YouTube Data API v3 is enabled
- ✅ Try regenerating the API key

### Error: "Quota exceeded"
- ⏰ Wait 24 hours for quota to reset
- 💡 Use sample data mode in the meantime

### No videos showing up
- ✅ Make sure your channel has public videos
- ✅ Check that videos aren't unlisted or private

---

## 📝 Sample Data vs Real Data

### Sample Data (No API Key)
- Shows demo videos with realistic engagement
- Good for testing the UI
- Updates in Firestore
- Marked with `isSampleData: true`

### Real Data (With API Key)
- Fetches your actual YouTube statistics
- Shows real subscriber count
- Displays actual video performance
- Updates every time you sync

---

## 🎯 Next Steps

After syncing YouTube data:

1. **View Dashboard** - See YouTube metrics in the Growth Analytics chart
2. **Check Insights** - Get AI recommendations for your YouTube content
3. **Compare Platforms** - See how YouTube compares to Instagram/Facebook
4. **Schedule Content** - Plan your next YouTube video

---

## 🔗 Useful Links

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com)
- [YouTube Studio](https://studio.youtube.com)
- [API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)

---

## 💡 Pro Tips

1. **Sync Daily**: Run sync once per day to track growth
2. **Monitor Quota**: Check your quota usage in Google Cloud Console
3. **Analyze Trends**: Compare week-over-week performance
4. **Cross-Platform**: Compare YouTube performance with other platforms

---

## ✨ Features After Setup

Once configured, you'll get:

- 📈 Real-time subscriber count
- 🎬 Latest video performance
- 💬 Engagement analytics (likes, comments)
- 🏆 Top performing videos
- 📊 Growth charts and trends
- 🤖 AI-powered content recommendations

---

## Need Help?

If you run into issues:
1. Check the troubleshooting section above
2. Review the console logs in your app
3. Verify your API key and Channel ID
4. Try using sample data mode first

Happy content creating! 🎥✨
