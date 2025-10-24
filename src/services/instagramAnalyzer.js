import { OPENAI_API_URL, OPENAI_CONFIG } from '../config/openai.config';

/**
 * Instagram Data Analyzer Service
 * Fetches and analyzes your Instagram posts to find patterns
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
 * Call OpenAI API with chat format
 */
const callOpenAI = async (messages) => {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.model,
        messages: messages,
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: OPENAI_CONFIG.maxTokens,
        top_p: OPENAI_CONFIG.topP,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    
    throw new Error('No response from OpenAI');
  } catch (error) {
    console.error('OpenAI API Error:', error);
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

  const messages = [
    {
      role: 'system',
      content: `You are an expert social media content strategist. Analyze the user's Instagram performance data and suggest ${count} highly personalized post ideas that will perform well based on their past success patterns. Consider their top keywords, engagement rates, and successful caption styles.`
    },
    {
      role: 'user',
      content: `Based on this Instagram account data, suggest ${count} new post ideas that are likely to get high engagement:

${analysisText}

For each suggestion, provide:
1. Topic: [Specific topic based on their successful themes]
2. Caption: [Full caption in their successful style, ready to post]
3. Best Time: [Recommended posting time based on their data]
4. Expected Engagement: [Realistic prediction based on their averages]

Format each suggestion clearly numbered 1-${count}.`
    }
  ];

  try {
    const response = await callOpenAI(messages);
    
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
  const messages = [
    {
      role: 'system',
      content: 'You are a social media expert who writes captions in the style of successful posts. Match the tone, structure, and elements that have performed well.'
    },
    {
      role: 'user',
      content: `Write an Instagram caption about "${topic}" in the style of these successful captions:

${instagramAnalysis.topCaptions.slice(0, 3).join('\n\n---\n\n')}

Key elements that worked:
- Keywords: ${instagramAnalysis.topKeywords.join(', ')}
- Average engagement: ${instagramAnalysis.avgLikes} likes, ${instagramAnalysis.avgComments} comments

Create a caption that matches this style and is likely to perform well.`
    }
  ];

  try {
    const caption = await callOpenAI(messages);
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
  const messages = [
    {
      role: 'system',
      content: 'You are a hashtag expert. Generate relevant, high-performing hashtags.'
    },
    {
      role: 'user',
      content: `Generate 15 hashtags for this caption: "${caption}"

Account keywords that work well: ${instagramAnalysis.topKeywords.join(', ')}

Mix:
- 5 high-competition hashtags (1M+ posts)
- 5 medium-competition (100K-1M posts)
- 5 niche-specific (under 100K posts)

Return only hashtags, one per line, with # symbol.`
    }
  ];

  try {
    const response = await callOpenAI(messages);
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
  const messages = [
    {
      role: 'system',
      content: 'You are a data-driven social media strategist. Provide actionable insights.'
    },
    {
      role: 'user',
      content: `Analyze this Instagram account and provide strategy recommendations:

Performance Data:
- ${instagramAnalysis.totalPosts} posts analyzed
- Average: ${instagramAnalysis.avgLikes} likes, ${instagramAnalysis.avgComments} comments
- Best posting time: ${instagramAnalysis.bestPostingHour}:00
- Successful keywords: ${instagramAnalysis.topKeywords.join(', ')}

Provide:
1. What's working well (2-3 points)
2. Areas for improvement (2-3 points)
3. Next 3 content themes to try
4. Posting schedule recommendation`
    }
  ];

  try {
    const strategy = await callOpenAI(messages);
    return strategy;
  } catch (error) {
    console.error('Error getting strategy:', error);
    throw error;
  }
};
