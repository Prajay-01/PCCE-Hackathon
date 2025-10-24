/**
 * Gemini AI Configuration
 * 
 * To get your Gemini API key:
 * 1. Go to https://makersuite.google.com/app/apikey
 * 2. Click "Create API Key"
 * 3. Copy the key and paste it below
 */

export const GEMINI_CONFIG = {
  apiKey: 'AIzaSyBo-kABnck_bHH2AQdyIdwk-rPQfrfuSBA', // Your Gemini API key
  model: 'gemini-2.5-flash', // Using Gemini 2.5 Flash (latest stable)
  temperature: 0.7, // Controls creativity (0.0 - 1.0)
  maxTokens: 2048,
  topP: 0.95,
  topK: 64,
};

// API endpoint using v1beta
export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.model}:generateContent?key=${GEMINI_CONFIG.apiKey}`;

export default GEMINI_CONFIG;
