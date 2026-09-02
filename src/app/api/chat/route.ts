import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, apiKey: userApiKey, modelName = 'gemini-1.5-flash' } = await req.json();

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      const fallbackText = "Hello! 👋 I am your Next.js AI Assistant.\n\nTo enable live responses from Google Gemini:\n1. Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).\n2. Click the **API Key** button in the top right corner of this app and paste your key!";
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = fallbackText.split(' ');
          for (const word of words) {
            controller.enqueue(encoder.encode(word + ' '));
            await new Promise((r) => setTimeout(r, 30));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Initialize Google Gemini provider with API Key
    const google = createGoogleGenerativeAI({ apiKey });

    // Stream text response using Vercel AI SDK
    const result = streamText({
      model: google(modelName),
      system: 'You are an intelligent, helpful, and concise AI coding and general knowledge assistant. Format your answers clearly using Markdown, and wrap code in appropriate markdown code blocks.',
      messages,
    });

    // toTextStreamResponse streams raw text without AI SDK protocol prefixes (like 0: or 3:)
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Error in /api/chat route:', error);
    const errorMessage = error?.message || 'Failed to connect to Google Gemini API.';
    return new Response(
      `⚠️ **API Error**: ${errorMessage}\n\nPlease check if your Gemini API key is valid and has active quota.`,
      {
        status: 200, // Return 200 so stream reader displays clean error message
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }
    );
  }
}
