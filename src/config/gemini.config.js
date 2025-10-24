/**
 * Gemini AI Configuration
 * 
 * To get your Gemini API key:
 * 1. Go to https://makersuite.google.com/app/apikey
 * 2. Click "Create API Key"
 * 3. Copy the key and paste it below
 */

export const GEMINI_CONFIG = {
  apiKey: 'YOUR_GEMINI_API_KEY_HERE', // Replace with your actual API key
  model: 'gemini-pro',
  temperature: 0.7, // Controls creativity (0.0 - 1.0)
  maxTokens: 1024,
  topP: 0.95,
  topK: 40,
};

// API endpoint
export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.model}:generateContent?key=${GEMINI_CONFIG.apiKey}`;

export default GEMINI_CONFIG;
