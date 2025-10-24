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
  const prompt = `You are a social media expert. Generate ${count} creative post ideas for ${platform}.

Context:
- Niche: ${niche}
- Tone: ${tone}
- Platform: ${platform}

For each idea, provide:
1. An engaging topic
2. A complete caption (optimized for ${platform})
3. Estimated engagement potential (as a percentage)

Format the response as a JSON array with objects containing: topic, caption, engagement

Make the captions platform-specific, engaging, and include relevant emojis.`;

  try {
    const response = await callGeminiAPI(prompt);
    
    // Try to parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const ideas = JSON.parse(jsonMatch[0]);
      return ideas.map((idea, index) => ({
        id: `ai_idea_${Date.now()}_${index}`,
        topic: idea.topic,
        caption: idea.caption,
        platform,
        niche,
        estimatedEngagement: idea.engagement || Math.floor(Math.random() * 15) + 10,
        createdAt: new Date().toISOString(),
        source: 'gemini-ai',
      }));
    }
    
    // Fallback: parse text response
    return [{
      id: `ai_idea_${Date.now()}`,
      topic: niche,
      caption: response.substring(0, 300),
      platform,
      niche,
      estimatedEngagement: 75,
      createdAt: new Date().toISOString(),
      source: 'gemini-ai',
    }];
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
  const prompt = `Analyze this ${platform} post and generate ${count} highly relevant, trending hashtags:

Caption: "${caption}"

Niche: ${niche}
Platform: ${platform}

Requirements:
- Mix of popular and niche-specific hashtags
- Include trending hashtags relevant to the content
- Prioritize hashtags with high engagement potential
- Balance reach vs. specificity

Return only the hashtags in a comma-separated list (e.g., #Tech, #AI, #Innovation)`;

  try {
    const response = await callGeminiAPI(prompt);
    
    // Extract hashtags from response
    const hashtags = response
      .split(/[,\s]+/)
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.trim())
      .slice(0, count);
    
    return hashtags.length > 0 ? hashtags : ['#Content', '#SocialMedia', `#${niche}`];
  } catch (error) {
    console.error('Error generating AI hashtags:', error);
    throw error;
  }
};

/**
 * Analyze and improve existing caption
 */
export const improveCaption = async (caption, platform) => {
  const prompt = `You are a social media expert. Analyze and improve this ${platform} caption:

Original Caption:
"${caption}"

Provide:
1. An improved version with better engagement potential
2. 3 specific suggestions for improvement
3. Engagement score (0-100) for original vs improved

Format as JSON with: improved, suggestions (array), originalScore, improvedScore`;

  try {
    const response = await callGeminiAPI(prompt);
    
    // Try to parse JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback
    return {
      improved: response.split('\n')[0],
      suggestions: ['Add more emojis', 'Include a call-to-action', 'Make the hook stronger'],
      originalScore: 60,
      improvedScore: 85,
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
