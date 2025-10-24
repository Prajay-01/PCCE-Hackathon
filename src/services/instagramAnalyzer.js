import { GEMINI_API_URL, GEMINI_CONFIG } from '../config/gemini.config';

/**
 * Instagram Data Analyzer Service
 * Fetches and analyzes your Instagram posts to find patterns
 * Uses Gemini AI for intelligent content generation
 */

/**
 * Fetch user's Instagram posts with engagement metrics
 */
export const fetchInstagramPosts = async (accessToken) => {
  try {
    const fields = 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,insights.metric(engagement,impressions,reach,saved)';
    
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=${fields}&access_token=${accessToken}&limit=25`
    );
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    throw error;
  }
};

/**
 * Analyze Instagram posts to find patterns
 */
export const analyzeInstagramData = async (posts) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  // Calculate metrics
  const totalPosts = posts.length;
  const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
  const avgLikes = totalLikes / totalPosts;
  const avgComments = totalComments / totalPosts;
  
  // Find top performing posts
  const topPosts = [...posts]
    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
    .slice(0, 5);
  
  // Extract successful caption patterns
  const topCaptions = topPosts
    .map(post => post.caption || '')
    .filter(caption => caption.length > 0);
  
  // Analyze posting times
  const postingTimes = posts.map(post => {
    const date = new Date(post.timestamp);
    return {
      hour: date.getHours(),
      day: date.getDay(),
      engagement: (post.like_count || 0) + (post.comments_count || 0)
    };
  });
  
  // Find best posting time
  const timeEngagement = {};
  postingTimes.forEach(({ hour, engagement }) => {
    timeEngagement[hour] = (timeEngagement[hour] || 0) + engagement;
  });
  
  const bestHour = Object.keys(timeEngagement).reduce((a, b) => 
    timeEngagement[a] > timeEngagement[b] ? a : b
  );
  
  // Extract common topics/keywords from top captions
  const allWords = topCaptions.join(' ').toLowerCase().split(/\s+/);
  const wordFrequency = {};
  allWords.forEach(word => {
    if (word.length > 4) { // Only meaningful words
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });
  
  const topKeywords = Object.entries(wordFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  return {
    totalPosts,
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    topCaptions,
    topKeywords,
    bestPostingHour: parseInt(bestHour),
    topPerformingPosts: topPosts.map(post => ({
      caption: post.caption?.substring(0, 100) + '...',
      likes: post.like_count,
      comments: post.comments_count,
      permalink: post.permalink
    }))
  };
};

/**
 * Call Gemini API
 */
const callGeminiAPI = async (prompt) => {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: GEMINI_CONFIG.temperature,
          topK: GEMINI_CONFIG.topK,
          topP: GEMINI_CONFIG.topP,
          maxOutputTokens: GEMINI_CONFIG.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('No response from Gemini');
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

/**
 * Generate personalized post suggestions based on Instagram data
 */
export const generatePersonalizedSuggestions = async (instagramAnalysis, platform = 'instagram', count = 5) => {
  const analysisText = `
Account Performance Analysis:
- Total Posts Analyzed: ${instagramAnalysis.totalPosts}
- Average Likes per Post: ${instagramAnalysis.avgLikes}
- Average Comments per Post: ${instagramAnalysis.avgComments}
- Best Posting Time: ${instagramAnalysis.bestPostingHour}:00
- Top Keywords: ${instagramAnalysis.topKeywords.join(', ')}

Top Performing Captions (for reference):
${instagramAnalysis.topCaptions.slice(0, 3).map((cap, i) => `${i + 1}. ${cap.substring(0, 150)}...`).join('\n')}
`;

  const prompt = `You are an expert social media content strategist. Based on this Instagram account data, suggest ${count} new post ideas that are likely to get high engagement:

${analysisText}

For each suggestion, provide:
1. Topic: [Specific topic based on their successful themes]
2. Caption: [Full caption in their successful style, ready to post]
3. Best Time: [Recommended posting time based on their data]
4. Expected Engagement: [Realistic prediction based on their averages]

Format each suggestion clearly numbered 1-${count}.`;

  try {
    const response = await callGeminiAPI(prompt);
    
    // Parse AI response into structured suggestions
    const suggestions = [];
    const lines = response.split('\n').filter(line => line.trim());
    
    let currentSuggestion = {};
    
    for (const line of lines) {
      const topicMatch = line.match(/Topic:\s*(.+)/i);
      const captionMatch = line.match(/Caption:\s*(.+)/i);
      const timeMatch = line.match(/Best Time:\s*(.+)/i);
      const engagementMatch = line.match(/Expected Engagement:\s*(.+)/i);
      
      if (topicMatch) {
        if (Object.keys(currentSuggestion).length > 0) {
          suggestions.push(currentSuggestion);
        }
        currentSuggestion = { topic: topicMatch[1].trim() };
      } else if (captionMatch && currentSuggestion.topic) {
        currentSuggestion.caption = captionMatch[1].trim();
      } else if (timeMatch && currentSuggestion.topic) {
        currentSuggestion.bestTime = timeMatch[1].trim();
      } else if (engagementMatch && currentSuggestion.topic) {
        currentSuggestion.expectedEngagement = engagementMatch[1].trim();
      }
    }
    
    // Add last suggestion
    if (Object.keys(currentSuggestion).length > 0) {
      suggestions.push(currentSuggestion);
    }
    
    // Format for app
    return suggestions.map((sug, index) => ({
      id: `ai_personalized_${Date.now()}_${index}`,
      topic: sug.topic || `Personalized Idea ${index + 1}`,
      caption: sug.caption || response.substring(0, 200),
      platform,
      estimatedEngagement: instagramAnalysis.avgLikes,
      bestTime: sug.bestTime || `${instagramAnalysis.bestPostingHour}:00`,
      createdAt: new Date().toISOString(),
      source: 'openai-personalized',
      insights: sug.expectedEngagement || 'Based on your performance data'
    }));
  } catch (error) {
    console.error('Error generating personalized suggestions:', error);
    throw error;
  }
};

/**
 * Generate caption based on user's successful style
 */
export const generatePersonalizedCaption = async (topic, instagramAnalysis, platform = 'instagram') => {
  const prompt = `Write an Instagram caption about "${topic}" in the style of these successful captions:

${instagramAnalysis.topCaptions.slice(0, 3).join('\n\n---\n\n')}

Key elements that worked:
- Keywords: ${instagramAnalysis.topKeywords.join(', ')}
- Average engagement: ${instagramAnalysis.avgLikes} likes, ${instagramAnalysis.avgComments} comments

Create a caption that matches this style and is likely to perform well. Return only the caption text, ready to post.`;

  try {
    const caption = await callGeminiAPI(prompt);
    return caption.trim();
  } catch (error) {
    console.error('Error generating personalized caption:', error);
    throw error;
  }
};

/**
 * Generate hashtags based on successful posts
 */
export const generatePersonalizedHashtags = async (caption, instagramAnalysis) => {
  const prompt = `Generate 15 hashtags for this caption: "${caption}"

Account keywords that work well: ${instagramAnalysis.topKeywords.join(', ')}

Mix:
- 5 high-competition hashtags (1M+ posts)
- 5 medium-competition (100K-1M posts)
- 5 niche-specific (under 100K posts)

Return only hashtags, one per line, with # symbol.`;

  try {
    const response = await callGeminiAPI(prompt);
    const hashtags = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('#'))
      .slice(0, 15);
    
    return hashtags;
  } catch (error) {
    console.error('Error generating hashtags:', error);
    throw error;
  }
};

/**
 * Get content strategy advice
 */
export const getContentStrategy = async (instagramAnalysis) => {
  const prompt = `Analyze this Instagram account and provide strategy recommendations:

Performance Data:
- ${instagramAnalysis.totalPosts} posts analyzed
- Average: ${instagramAnalysis.avgLikes} likes, ${instagramAnalysis.avgComments} comments
- Best posting time: ${instagramAnalysis.bestPostingHour}:00
- Successful keywords: ${instagramAnalysis.topKeywords.join(', ')}

Provide:
1. What's working well (2-3 points)
2. Areas for improvement (2-3 points)
3. Next 3 content themes to try
4. Posting schedule recommendation`;

  try {
    const strategy = await callGeminiAPI(prompt);
    return strategy;
  } catch (error) {
    console.error('Error getting strategy:', error);
    throw error;
  }
};
