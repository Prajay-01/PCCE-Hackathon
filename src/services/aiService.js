import { GEMINI_API_URL, GEMINI_CONFIG } from '../config/gemini.config';

/**
 * Enhanced AI Service using Google Gemini AI
 * Provides intelligent content generation for social media creators
 */

/**
 * Call Gemini API with a prompt
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
 * Generate creative post ideas using AI
 */
export const generateAIPostIdeas = async (niche, platform, tone = 'professional', count = 5) => {
  const prompt = `Generate ${count} creative social media post ideas for ${platform} in the ${niche} niche with a ${tone} tone.

For each idea, provide:
- Topic (short phrase)
- Caption (2-3 sentences, engaging and ready to post)
- Engagement score (number between 60-95)

Format as plain text, one idea per line like this:
1. Topic: [topic] | Caption: [caption] | Score: [number]`;

  try {
    const response = await callGeminiAPI(prompt);
    
    // Parse the response manually
    const lines = response.split('\n').filter(line => line.trim());
    const ideas = [];
    
    for (let i = 0; i < Math.min(lines.length, count); i++) {
      const line = lines[i];
      
      // Try to extract topic, caption, and score
      const topicMatch = line.match(/Topic:\s*([^|]+)/i);
      const captionMatch = line.match(/Caption:\s*([^|]+)/i);
      const scoreMatch = line.match(/Score:\s*(\d+)/i);
      
      if (topicMatch || captionMatch) {
        ideas.push({
          id: `ai_idea_${Date.now()}_${i}`,
          topic: topicMatch ? topicMatch[1].trim() : `${niche} idea ${i + 1}`,
          caption: captionMatch ? captionMatch[1].trim() : line.substring(0, 200),
          platform,
          niche,
          estimatedEngagement: scoreMatch ? parseInt(scoreMatch[1]) : Math.floor(Math.random() * 20) + 65,
          createdAt: new Date().toISOString(),
          source: 'gemini-ai',
        });
      }
    }
    
    // If parsing failed, create one idea from the response
    if (ideas.length === 0) {
      ideas.push({
        id: `ai_idea_${Date.now()}`,
        topic: `${niche} content`,
        caption: response.substring(0, 250).trim(),
        platform,
        niche,
        estimatedEngagement: 75,
        createdAt: new Date().toISOString(),
        source: 'gemini-ai',
      });
    }
    
    return ideas;
  } catch (error) {
    console.error('Error generating AI ideas:', error);
    throw error;
  }
};

/**
 * Generate AI-powered caption
 */
export const generateAICaption = async (topic, platform, tone, additionalContext = '') => {
  const platformGuidelines = {
    instagram: 'Keep it engaging with emojis, use line breaks, 100-300 characters ideal. Include a call-to-action.',
    twitter: 'Keep it concise (under 280 characters), punchy, and use 1-2 relevant emojis.',
    linkedin: 'Professional tone, value-driven, 150-300 words. Focus on insights and expertise.',
    youtube: 'Engaging title (60 chars max) and detailed description with timestamps.',
  };

  const prompt = `Create a ${tone} ${platform} post about: ${topic}

Platform guidelines: ${platformGuidelines[platform] || platformGuidelines.instagram}

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Requirements:
- Make it highly engaging and shareable
- Include relevant emojis (but don't overuse)
- Add a strong hook in the first line
- Include a clear call-to-action
- Optimize for maximum engagement

Generate only the caption text, ready to copy and paste.`;

  try {
    const caption = await callGeminiAPI(prompt);
    return caption.trim();
  } catch (error) {
    console.error('Error generating AI caption:', error);
    throw error;
  }
};

/**
 * Generate smart hashtags using AI
 */
export const generateAIHashtags = async (caption, platform, niche, count = 10) => {
  const prompt = `Generate ${count} relevant hashtags for this ${platform} post in the ${niche} niche.

Post: "${caption.substring(0, 200)}"

Requirements:
- Mix of popular and niche-specific
- Relevant to the content
- Format: List hashtags separated by spaces, starting with #
- Example: #Tech #AI #Innovation

Generate only the hashtags, nothing else.`;

  try {
    const response = await callGeminiAPI(prompt);
    
    // Extract hashtags from response
    const hashtagMatches = response.match(/#\w+/g);
    
    if (hashtagMatches && hashtagMatches.length > 0) {
      return hashtagMatches.slice(0, count);
    }
    
    // Fallback: create hashtags from words
    const words = response.split(/\s+/).filter(word => word.length > 3);
    return words.slice(0, count).map(word => 
      `#${word.replace(/[^a-zA-Z0-9]/g, '')}`
    ).filter(tag => tag.length > 2);
  } catch (error) {
    console.error('Error generating AI hashtags:', error);
    // Return basic hashtags as fallback
    return [`#${niche}`, `#${platform}`, '#Content', '#SocialMedia'];
  }
};

/**
 * Analyze and improve existing caption
 */
export const improveCaption = async (caption, platform) => {
  const prompt = `Improve this ${platform} caption:

Original: "${caption}"

Provide:
1. IMPROVED VERSION: [write the improved caption]
2. SUGGESTION 1: [first suggestion]
3. SUGGESTION 2: [second suggestion]  
4. SUGGESTION 3: [third suggestion]
5. ORIGINAL SCORE: [number 0-100]
6. IMPROVED SCORE: [number 0-100]

Keep it simple and clear.`;

  try {
    const response = await callGeminiAPI(prompt);
    
    // Parse the response
    const improvedMatch = response.match(/IMPROVED VERSION:?\s*(.+?)(?=SUGGESTION|$)/is);
    const suggestions = [];
    const suggestionMatches = response.matchAll(/SUGGESTION \d+:?\s*(.+?)(?=SUGGESTION|\d+\.|$)/gis);
    for (const match of suggestionMatches) {
      if (match[1]) suggestions.push(match[1].trim());
    }
    
    const originalScoreMatch = response.match(/ORIGINAL SCORE:?\s*(\d+)/i);
    const improvedScoreMatch = response.match(/IMPROVED SCORE:?\s*(\d+)/i);
    
    return {
      improved: improvedMatch ? improvedMatch[1].trim() : caption + ' (Enhanced with AI)',
      suggestions: suggestions.length > 0 ? suggestions.slice(0, 3) : [
        'Add more emojis for visual appeal',
        'Include a clear call-to-action',
        'Make the hook more compelling'
      ],
      originalScore: originalScoreMatch ? parseInt(originalScoreMatch[1]) : 65,
      improvedScore: improvedScoreMatch ? parseInt(improvedScoreMatch[1]) : 85,
    };
  } catch (error) {
    console.error('Error improving caption:', error);
    throw error;
  }
};

/**
 * Get content strategy recommendations
 */
export const getContentStrategy = async (niche, platform, currentMetrics = {}) => {
  const prompt = `You are a social media strategist. Create a content strategy for:

Niche: ${niche}
Platform: ${platform}
Current Performance: ${JSON.stringify(currentMetrics)}

Provide:
1. Top 5 content themes to focus on
2. Best posting times and frequency
3. Content format recommendations (carousels, reels, etc.)
4. Engagement tactics
5. Growth strategy for next 30 days

Format as detailed recommendations.`;

  try {
    const strategy = await callGeminiAPI(prompt);
    return strategy;
  } catch (error) {
    console.error('Error generating strategy:', error);
    throw error;
  }
};

/**
 * Generate trending content ideas based on current trends
 */
export const getTrendingContentIdeas = async (niche) => {
  const prompt = `As a social media trend analyst, identify the top 10 trending topics in ${niche} for October 2025.

For each trend:
- Topic name
- Why it's trending
- Content angle to take
- Estimated virality potential (1-10)

Focus on actionable, timely trends that content creators can capitalize on NOW.`;

  try {
    const trends = await callGeminiAPI(prompt);
    return trends;
  } catch (error) {
    console.error('Error getting trends:', error);
    throw error;
  }
};

/**
 * Analyze competitor content
 */
export const analyzeCompetitorContent = async (competitorCaption, yourNiche) => {
  const prompt = `Analyze this competitor's post and suggest how to create better content:

Competitor Post:
"${competitorCaption}"

Your Niche: ${yourNiche}

Provide:
1. What makes this post effective (or not)
2. Key elements you can adapt
3. How to create a better version
4. Unique angles to differentiate

Be specific and actionable.`;

  try {
    const analysis = await callGeminiAPI(prompt);
    return analysis;
  } catch (error) {
    console.error('Error analyzing competitor:', error);
    throw error;
  }
};

/**
 * Generate content calendar
 */
export const generateContentCalendar = async (niche, platform, days = 7) => {
  const prompt = `Create a ${days}-day content calendar for a ${niche} creator on ${platform}.

For each day, provide:
- Date and time to post
- Content type (reel, carousel, story, etc.)
- Topic and caption idea
- Hashtag strategy
- Expected engagement

Make it diverse and strategically planned for maximum growth.

Format as a structured day-by-day plan.`;

  try {
    const calendar = await callGeminiAPI(prompt);
    return calendar;
  } catch (error) {
    console.error('Error generating calendar:', error);
    throw error;
  }
};

/**
 * AI Chat Assistant for creators
 */
export const chatWithAI = async (userMessage, conversationHistory = []) => {
  const context = conversationHistory.length > 0 
    ? `Previous conversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\n`
    : '';

  const prompt = `${context}You are an expert social media growth assistant. Help the creator with their question:

${userMessage}

Provide actionable, specific advice that they can implement immediately. Be encouraging and supportive.`;

  try {
    const response = await callGeminiAPI(prompt);
    return response;
  } catch (error) {
    console.error('Error in AI chat:', error);
    throw error;
  }
};

export const aiService = {
  generateAIPostIdeas,
  generateAICaption,
  generateAIHashtags,
  improveCaption,
  getContentStrategy,
  getTrendingContentIdeas,
  analyzeCompetitorContent,
  generateContentCalendar,
  chatWithAI,
};

export default aiService;
