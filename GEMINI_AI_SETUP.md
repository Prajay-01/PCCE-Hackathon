# 🤖 Gemini AI Integration Guide

## Enhanced AI Features

Your Content Growth Assistant now includes powerful AI features powered by Google's Gemini AI:

### ✨ New AI Capabilities

1. **AI-Powered Post Ideas**
   - Generates creative, platform-specific content ideas
   - Tailored to your niche and tone
   - Higher quality than template-based suggestions

2. **Smart Caption Generation**
   - Context-aware captions optimized for each platform
   - Includes emojis, hooks, and CTAs automatically
   - Follows platform best practices

3. **Intelligent Hashtag Suggestions**
   - Analyzes your content to suggest relevant hashtags
   - Mix of trending and niche-specific tags
   - Optimized for maximum reach

4. **Caption Improvement**
   - Analyzes existing captions
   - Provides specific improvement suggestions
   - Shows before/after engagement scores

5. **AI Chat Assistant**
   - Ask questions about content strategy
   - Get personalized growth advice
   - Real-time help with social media challenges

6. **7-Day Content Calendar**
   - AI-generated content plan
   - Strategic posting schedule
   - Platform-specific recommendations

---

## 🔑 How to Get Your Gemini API Key

### Step 1: Visit Google AI Studio
1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account

### Step 2: Create API Key
1. Click **"Create API Key"**
2. Select or create a Google Cloud project
3. Copy the generated API key

### Step 3: Add to Your App
1. Open `src/config/gemini.config.js`
2. Replace `'YOUR_GEMINI_API_KEY_HERE'` with your actual API key:

```javascript
export const GEMINI_CONFIG = {
  apiKey: 'YOUR_ACTUAL_API_KEY_HERE', // ← Paste your key here
  model: 'gemini-pro',
  temperature: 0.7,
  maxTokens: 1024,
  topP: 0.95,
  topK: 40,
};
```

### Step 4: Test the Integration
1. Restart your Expo app
2. Go to the **Assistant** tab
3. Toggle on **"🤖 Gemini AI Powered"**
4. Try generating content!

---

## 📱 How to Use AI Features

### Toggle AI Mode
- In the Assistant screen, you'll see a chip at the top
- **🤖 Gemini AI Powered** - Uses real AI (requires API key)
- **📝 Template Mode** - Uses built-in templates (no API needed)

### Generate AI Content
1. Select your platform (Instagram, Twitter, LinkedIn, YouTube)
2. Choose your niche and tone
3. Enter a topic
4. Click **"✨ Generate with AI"**
5. Wait a few seconds for AI to create your content

### Improve Existing Captions
1. Generate or paste a caption
2. Click **"🚀 Improve with AI"**
3. Review AI suggestions
4. Apply the improved version

### AI Chat Assistant
1. Click the chat icon (💬) in the header
2. Ask questions like:
   - "What are the best hashtags for tech content?"
   - "How can I increase engagement on Instagram?"
   - "What type of content should I post this week?"
3. Get personalized AI responses

### Generate Content Calendar
1. Click the calendar icon (📅) in the header
2. AI creates a 7-day posting schedule
3. Includes topics, times, and content types

---

## ⚙️ Configuration Options

In `src/config/gemini.config.js`, you can adjust:

### Temperature (0.0 - 1.0)
- **Lower (0.3-0.5)**: More focused, consistent output
- **Medium (0.6-0.8)**: Balanced creativity and coherence (recommended)
- **Higher (0.9-1.0)**: More creative, diverse output

### Max Tokens
- Controls response length
- Default: 1024 (suitable for captions)
- Increase for longer content

---

## 💡 Tips for Best Results

### 1. Be Specific
❌ "Generate a post"
✅ "Generate an Instagram post about AI in healthcare, professional tone"

### 2. Use the Right Tone
- **Professional**: Business, LinkedIn, formal content
- **Casual**: Relatable, friendly, everyday content
- **Inspirational**: Motivational, uplifting messages

### 3. Leverage Platform Selection
- Each platform has different optimization
- AI adjusts caption length, style, and format

### 4. Iterate with Improvements
- Generate initial content
- Use "Improve with AI" for refinement
- Apply suggestions to enhance quality

### 5. Use AI Chat for Strategy
- Don't just generate content
- Ask for strategic advice
- Learn growth tactics

---

## 🚨 Troubleshooting

### "Failed to generate content"
**Solution**: Check your API key in `gemini.config.js`

### "API error: 401"
**Solution**: Your API key is invalid. Get a new one from Google AI Studio

### "API error: 429"
**Solution**: You've exceeded the free tier quota. Wait or upgrade your plan

### Slow responses
**Solution**: This is normal! AI generation takes 3-5 seconds

### Generic responses
**Solution**: 
- Be more specific in your topic
- Add additional context
- Adjust temperature in config

---

## 📊 API Limits (Free Tier)

- **Requests per minute**: 60
- **Requests per day**: 1,500
- **Tokens per request**: 32,000 input + 2,048 output

For most users, this is plenty for daily content creation!

---

## 🔒 Security Best Practices

1. **Never commit your API key to Git**
   - Already added to `.gitignore`
   - Don't share your config file

2. **Rotate your key periodically**
   - Generate new keys every few months
   - Delete old unused keys

3. **Monitor usage**
   - Check Google Cloud Console for usage stats
   - Set up billing alerts

---

## 🎯 What to Expect

### With AI Mode ON (🤖)
- ✅ High-quality, unique content
- ✅ Context-aware suggestions
- ✅ Personalized to your niche
- ⏱️ Takes 3-5 seconds per generation
- 📡 Requires internet connection

### With Template Mode (📝)
- ✅ Instant generation
- ✅ No API key needed
- ✅ Works offline
- ⚠️ Less personalized
- ⚠️ Limited variety

---

## 🚀 Next Steps

1. ✅ Get your Gemini API key
2. ✅ Add it to `gemini.config.js`
3. ✅ Restart the app
4. ✅ Try AI content generation
5. ✅ Explore AI chat assistant
6. ✅ Generate a content calendar
7. ✅ Experiment with different tones and niches

---

## 📞 Need Help?

If you encounter issues:
1. Check the console for error messages
2. Verify your API key is correct
3. Ensure you have internet connection
4. Try switching to Template Mode as backup

---

## 🎉 Enjoy Your AI-Powered Content Creation!

Your app now has professional-grade AI assistance. Use it to:
- Save hours on content creation
- Improve engagement rates
- Learn effective strategies
- Grow your social media presence

Happy creating! 🚀✨
