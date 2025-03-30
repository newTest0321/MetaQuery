export async function POST(req) {
  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Get only the user's last message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    try {
      // Send just the last message to Gemini
      console.log('Sending message to Gemini:', lastMessage.content);
      
      // Make direct API call to Gemini 2.0 Flash
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBVgaz_HmtAYZsThzbImgNj-T-CK-iWJ-o`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: lastMessage.content }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from Gemini');
      }

      const data = await response.json();
      const text = data.candidates[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      console.log('Received response from Gemini:', text.substring(0, 100) + '...');

      return new Response(JSON.stringify({ content: text }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError);
      throw new Error(`Gemini API Error: ${geminiError.message}`);
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request', 
        details: error.message 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
} 