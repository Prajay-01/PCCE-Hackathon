/**
 * OpenAI Configuration
 * Using GPT-4o for intelligent content analysis and generation
 */

export const OPENAI_CONFIG = {
  apiKey: 'YOUR_OPENAI_API_KEY', // Get from: https://platform.openai.com/api-keys
  model: 'gpt-4o', // Best model for data analysis + creativity
  temperature: 0.7, // Balance between creativity and consistency
  maxTokens: 2000,
  topP: 0.9,
};

export const OPENAI_API_URL = `https://api.openai.com/v1/chat/completions`;

/**
 * How to get your API key:
 * 1. Go to https://platform.openai.com/signup
 * 2. Create account or sign in
 * 3. Go to API Keys section
 * 4. Create new secret key
 * 5. Replace 'YOUR_OPENAI_API_KEY' above
 * 
 * Pricing (very affordable):
 * - GPT-4o: $0.005 per request
 * - Free $5 credit for new users
 * - Pay as you go after that
 */
