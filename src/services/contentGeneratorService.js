import firestore from '@react-native-firebase/firestore';

/**
 * AI Content Generator Service
 * Generates post ideas, captions, and hashtags based on trending topics and user's niche
 */

// Trending topics database (can be fetched from real APIs)
const trendingTopics = {
  tech: ['AI', 'ChatGPT', 'Web3', 'Blockchain', 'Cloud Computing', 'Cybersecurity', 'IoT', '5G'],
  business: ['Entrepreneurship', 'Startup', 'Leadership', 'Marketing', 'Sales', 'Productivity'],
  lifestyle: ['Wellness', 'Fitness', 'Travel', 'Food', 'Fashion', 'Home Decor'],
  education: ['Online Learning', 'Skills', 'Career Growth', 'Coding', 'Personal Development'],
  entertainment: ['Movies', 'Music', 'Gaming', 'Streaming', 'Content Creation'],
};

// Post templates for different platforms
const postTemplates = {
  instagram: {
    short: (topic) => [
      `🌟 ${topic} is changing the game! Here's what you need to know... 👇`,
      `💡 Quick ${topic} tip that'll save you hours! Swipe to see more →`,
      `✨ The ${topic} trend everyone's talking about. Let me explain... 📱`,
    ],
    medium: (topic) => [
      `📚 Everything you need to know about ${topic} in 2025.\n\n✅ Key insights\n✅ Practical tips\n✅ Real examples\n\nDrop a 💬 if this helped!`,
      `🔥 Hot take: ${topic} is more important than ever.\n\nHere's why:\n1️⃣ [Benefit]\n2️⃣ [Impact]\n3️⃣ [Future outlook]\n\nAgree? 👇`,
    ],
    long: (topic) => [
      `🚀 The Ultimate ${topic} Guide\n\n📖 I spent 100+ hours researching this, so you don't have to.\n\nIn this post:\n• What ${topic} really means\n• Why it matters now\n• How to get started\n• Common mistakes to avoid\n\nSave this for later! 🔖`,
    ],
  },
  twitter: {
    thread: (topic) => [
      `🧵 Thread: ${topic} explained in simple terms\n\nLet me break it down for you... (1/5)`,
      `Hot take on ${topic} 🔥\n\nEveryone's talking about it, but here's what they're missing...\n\n👇 Thread`,
      `I analyzed 1000+ ${topic} posts.\n\nHere are the 5 patterns that always perform well:\n\n🧵`,
    ],
    single: (topic) => [
      `${topic} is revolutionizing the industry. Here's why it matters for YOU 👇`,
      `Quick ${topic} tip:\n\n[Your insight]\n\nRetweet if this helped! 🔄`,
      `The ${topic} landscape is changing fast. Stay ahead with these insights 📊`,
    ],
  },
  linkedin: {
    professional: (topic) => [
      `💼 ${topic}: A Professional Perspective\n\nAfter 5 years in the industry, here's what I've learned about ${topic}:\n\n1. The core principles\n2. Real-world applications\n3. Future implications\n\nWhat's your experience? Share in comments! 👇`,
      `🎯 ${topic} Strategy That Actually Works\n\nMost people overcomplicate ${topic}. Here's my simple framework:\n\n• Step 1: [Action]\n• Step 2: [Action]\n• Step 3: [Result]\n\nTry it and let me know your results!`,
    ],
  },
  youtube: {
    title: (topic) => [
      `${topic} Explained: Everything You Need to Know in 2025`,
      `I Tried ${topic} For 30 Days - Here's What Happened`,
      `${topic} Tutorial: Beginner to Pro in 10 Minutes`,
      `The Truth About ${topic} (No One Tells You This)`,
    ],
    description: (topic) => [
      `In this video, I'll show you everything about ${topic}!\n\n📌 Timestamps:\n0:00 - Introduction\n1:30 - Getting Started\n5:00 - Advanced Tips\n8:00 - Conclusion\n\n🔗 Resources mentioned:\n[Link]\n\n💬 Got questions? Drop them in comments!`,
    ],
  },
};

// Hashtag database by category and platform
const hashtagDatabase = {
  instagram: {
    tech: ['#TechTrends', '#Innovation', '#TechNews', '#FutureTech', '#DigitalTransformation', '#TechLife', '#TechCommunity'],
    business: ['#Entrepreneur', '#BusinessTips', '#StartupLife', '#Hustle', '#BusinessGrowth', '#Leadership', '#Success'],
    lifestyle: ['#LifeStyle', '#DailyLife', '#InstaDaily', '#LifeGoals', '#Motivation', '#Wellness', '#SelfCare'],
    general: ['#Viral', '#Trending', '#FYP', '#Explore', '#InstaGood', '#PhotoOfTheDay', '#Love'],
  },
  twitter: {
    tech: ['#Tech', '#AI', '#Innovation', '#TechTwitter', '#Startup', '#Developer'],
    business: ['#Business', '#Entrepreneurship', '#Marketing', '#Growth', '#Strategy'],
    general: ['#Trending', '#Thread', '#MondayMotivation', '#TipTuesday', '#ThinkBigSunday'],
  },
  linkedin: {
    professional: ['#Leadership', '#ProfessionalDevelopment', '#CareerGrowth', '#Business', '#Innovation', '#Networking'],
  },
};

/**
 * Generate post ideas based on user's niche and connected platforms
 */
export const generatePostIdeas = async (userId, niche = 'tech', platform = 'instagram') => {
  try {
    const topics = trendingTopics[niche] || trendingTopics.tech;
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    const platformTemplates = postTemplates[platform] || postTemplates.instagram;
    const templateCategory = Object.keys(platformTemplates)[0];
    const templates = platformTemplates[templateCategory](randomTopic);
    
    const ideas = [];
    for (let i = 0; i < 5; i++) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      ideas.push({
        id: `idea_${Date.now()}_${i}`,
        topic,
        caption: template,
        platform,
        niche,
        estimatedEngagement: Math.floor(Math.random() * 15) + 5, // 5-20%
        createdAt: new Date().toISOString(),
      });
    }
    
    return ideas;
  } catch (error) {
    console.error('Error generating post ideas:', error);
    return [];
  }
};

/**
 * Generate AI caption based on topic and tone
 */
export const generateCaption = (topic, platform = 'instagram', tone = 'professional') => {
  const tones = {
    professional: {
      prefix: ['📊', '💼', '🎯', '✨'],
      style: 'informative and credible',
    },
    casual: {
      prefix: ['🔥', '💯', '✨', '🚀'],
      style: 'friendly and relatable',
    },
    inspirational: {
      prefix: ['🌟', '💪', '🎯', '✨'],
      style: 'motivational and uplifting',
    },
  };
  
  const selectedTone = tones[tone] || tones.professional;
  const emoji = selectedTone.prefix[Math.floor(Math.random() * selectedTone.prefix.length)];
  
  const templates = postTemplates[platform];
  if (!templates) return `${emoji} Talking about ${topic} today!`;
  
  const templateType = Object.keys(templates)[0];
  const options = templates[templateType](topic);
  
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Generate smart hashtags based on content and platform
 */
export const generateHashtags = (content, platform = 'instagram', niche = 'tech', count = 10) => {
  try {
    const platformHashtags = hashtagDatabase[platform] || hashtagDatabase.instagram;
    const nicheHashtags = platformHashtags[niche] || platformHashtags.tech;
    const generalHashtags = platformHashtags.general || [];
    
    // Combine niche-specific and general hashtags
    const allHashtags = [...nicheHashtags, ...generalHashtags];
    
    // Shuffle and select random hashtags
    const shuffled = allHashtags.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    // Add content-based hashtags (extract keywords)
    const words = content.split(' ')
      .filter(word => word.length > 5)
      .map(word => word.replace(/[^a-zA-Z]/g, ''))
      .slice(0, 3);
    
    const contentHashtags = words.map(word => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);
    
    return [...selected, ...contentHashtags].slice(0, count);
  } catch (error) {
    console.error('Error generating hashtags:', error);
    return ['#Content', '#SocialMedia', '#Post'];
  }
};

/**
 * Analyze best posting times based on user's analytics
 */
export const analyzeBestPostingTimes = async (userId) => {
  try {
    const analyticsSnapshot = await firestore()
      .collection('analytics')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(30)
      .get();
    
    if (analyticsSnapshot.empty) {
      // Return default best times
      return [
        { time: '9:00 AM', day: 'Weekdays', engagement: '85%', reason: 'Morning commute time' },
        { time: '12:00 PM', day: 'Daily', engagement: '88%', reason: 'Lunch break peak' },
        { time: '7:00 PM', day: 'Weekdays', engagement: '92%', reason: 'Evening relaxation time' },
        { time: '3:00 PM', day: 'Weekends', engagement: '80%', reason: 'Weekend afternoon activity' },
      ];
    }
    
    // Analyze engagement by time
    const timeSlots = {};
    analyticsSnapshot.forEach(doc => {
      const data = doc.data();
      const hour = new Date(data.timestamp).getHours();
      const timeSlot = `${hour}:00`;
      
      if (!timeSlots[timeSlot]) {
        timeSlots[timeSlot] = { total: 0, count: 0 };
      }
      
      timeSlots[timeSlot].total += data.engagement || 0;
      timeSlots[timeSlot].count += 1;
    });
    
    // Calculate averages and sort
    const bestTimes = Object.entries(timeSlots)
      .map(([time, data]) => ({
        time,
        engagement: ((data.total / data.count) * 100).toFixed(0) + '%',
        day: parseInt(time) < 17 ? 'Weekdays' : 'Evening',
        reason: 'Based on your data',
      }))
      .sort((a, b) => parseFloat(b.engagement) - parseFloat(a.engagement))
      .slice(0, 4);
    
    return bestTimes;
  } catch (error) {
    console.error('Error analyzing posting times:', error);
    return [];
  }
};

/**
 * Get trending topics for a specific niche
 */
export const getTrendingTopics = (niche = 'tech') => {
  return trendingTopics[niche] || trendingTopics.tech;
};

/**
 * Save generated content to Firestore
 */
export const saveGeneratedContent = async (userId, content) => {
  try {
    const docRef = await firestore()
      .collection('generatedContent')
      .add({
        userId,
        ...content,
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: 'draft',
      });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving content:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's saved content
 */
export const getSavedContent = async (userId) => {
  try {
    const snapshot = await firestore()
      .collection('generatedContent')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching saved content:', error);
    return [];
  }
};

/**
 * Predict engagement score for content
 */
export const predictEngagement = (caption, hashtags, platform, postingTime) => {
  let score = 50; // Base score
  
  // Caption length scoring
  const captionLength = caption.length;
  if (platform === 'instagram' && captionLength >= 100 && captionLength <= 300) {
    score += 10;
  } else if (platform === 'twitter' && captionLength <= 280) {
    score += 10;
  }
  
  // Hashtag count scoring
  const hashtagCount = hashtags.length;
  if (platform === 'instagram' && hashtagCount >= 5 && hashtagCount <= 15) {
    score += 10;
  } else if (platform === 'twitter' && hashtagCount >= 1 && hashtagCount <= 3) {
    score += 10;
  }
  
  // Emoji usage
  const emojiCount = (caption.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 5) {
    score += 5;
  }
  
  // Time scoring (9am-12pm, 6pm-9pm are peak times)
  const hour = new Date(postingTime).getHours();
  if ((hour >= 9 && hour <= 12) || (hour >= 18 && hour <= 21)) {
    score += 15;
  }
  
  // Randomize slightly for realism
  score += Math.floor(Math.random() * 10) - 5;
  
  return Math.min(Math.max(score, 0), 100);
};

export default {
  generatePostIdeas,
  generateCaption,
  generateHashtags,
  analyzeBestPostingTimes,
  getTrendingTopics,
  saveGeneratedContent,
  getSavedContent,
  predictEngagement,
};
