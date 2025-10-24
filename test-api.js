// Test Gemini API Key
const API_KEY = 'AIzaSyCGj7BC_GqxtVhE7kqHjqyFbQc1S62nf-o';
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API with gemini-2.5-flash...\n');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say hello in one sentence'
          }]
        }]
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ API KEY IS WORKING!');
      console.log('AI Response:', data.candidates[0].content.parts[0].text);
      console.log('\n🎉 Gemini AI is ready to use in your app!');
    } else {
      console.log('\n❌ API KEY FAILED');
      console.log('Error:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
}

testGeminiAPI();
