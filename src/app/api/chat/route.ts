import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, apiKey: userApiKey, modelName = 'gemini-3.5-flash' } = body;

    // Collect candidate API keys to try (user custom key first, then environment variable)
    const apiKeysToTry = [userApiKey, process.env.GEMINI_API_KEY].filter(
      (k, index, self) =>
        Boolean(k) &&
        typeof k === 'string' &&
        k.trim().length > 5 &&
        self.indexOf(k) === index
    );

    if (apiKeysToTry.length === 0) {
      const fallbackText =
        "Hello! 👋 I am your Next.js AI Assistant.\n\nTo enable live responses from Google Gemini:\n1. Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey) (your key will start with `AIzaSy...`).\n2. Click the **API Key** button in the top right corner of this app and paste your key!";

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

    // Strip '-latest' suffix if provided
    const cleanModelName = (modelName || '').replace(/-latest$/, '');

    // List of valid candidate models in order of preference (Fastest / working models first)
    const candidateModels = [
      cleanModelName,
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-flash-latest',
    ].filter((m, index, self) => Boolean(m) && self.indexOf(m) === index);

    const sanitizedMessages = (messages || [])
      .filter((m: any) => m && m.content && String(m.content).trim() !== '')
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content).trim() }],
      }));

    if (sanitizedMessages.length === 0) {
      return new Response('Please enter a message to begin.', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const lastUserMessage = sanitizedMessages.pop();
    const promptText = lastUserMessage?.parts[0]?.text || 'Hello';

    let streamIterator: any = null;
    let firstChunkText = '';
    let lastError: any = null;

    // Try available keys and candidate models
    keyLoop: for (const keyCandidate of apiKeysToTry) {
      const genAI = new GoogleGenerativeAI(keyCandidate);

      for (const targetModel of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: targetModel,
            systemInstruction: {
              role: 'system',
              parts: [
                {
                  text: 'You are an intelligent, helpful, and concise AI coding and general knowledge assistant. Format your answers clearly using Markdown, and wrap code in appropriate markdown code blocks.',
                },
              ],
            },
          });

          const chat = model.startChat({
            history: sanitizedMessages.length > 0 ? sanitizedMessages : undefined,
          });

          const streamResult = await chat.sendMessageStream(promptText);
          const iterator = streamResult.stream[Symbol.asyncIterator]();
          const firstChunk = await iterator.next();

          if (!firstChunk.done && firstChunk.value) {
            firstChunkText = firstChunk.value.text() || '';
            streamIterator = iterator;
            break keyLoop; // Successfully got response!
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Key/Model candidate failed (${targetModel}):`, err?.message);

          // Fast Fail: If key is unauthorized/invalid, no need to loop through remaining models with the same key
          const isAuthErr =
            err?.message?.includes('401') ||
            err?.message?.includes('Unauthorized') ||
            err?.message?.includes('UNAUTHENTICATED') ||
            err?.message?.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
            err?.message?.includes('API key not valid') ||
            err?.message?.includes('API_KEY_INVALID') ||
            err?.message?.includes('fetch failed');

          if (isAuthErr) {
            break; // Skip to next keyCandidate immediately
          }
        }
      }
    }

    const encoder = new TextEncoder();

    if (!streamIterator && !firstChunkText) {
      const errorMsg = lastError?.message || 'All Gemini model candidates failed to respond.';
      const isAuthError =
        errorMsg.includes('401') ||
        errorMsg.includes('Unauthorized') ||
        errorMsg.includes('UNAUTHENTICATED') ||
        errorMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
        errorMsg.includes('API key not valid') ||
        errorMsg.includes('API_KEY_INVALID') ||
        errorMsg.includes('fetch failed');

      let fallbackErrorText = `⚠️ **API Error**: ${errorMsg}\n\nPlease check that your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) is valid and active.\n\n👉 Click the **Key 🔑** button in the top right navbar to paste a valid Gemini API key (starts with \`AIzaSy...\`).`;

      if (isAuthError) {
        fallbackErrorText = `⚠️ **Invalid or Missing Gemini API Key**:\n\nThe current API key is invalid or unauthorized by Google Generative AI.\n\n👉 **How to fix this:**\n1. Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey) (Valid keys start with \`AIzaSy...\`)\n2. Click the **Key 🔑** button in the top right corner of this app and paste your key!`;
      }

      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(fallbackErrorText));
          controller.close();
        },
      });

      return new Response(errorStream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Stream remaining content directly to client
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          if (firstChunkText) {
            controller.enqueue(encoder.encode(firstChunkText));
          }
          while (true) {
            const { done, value } = await streamIterator.next();
            if (done) break;
            const chunkText = value.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          controller.close();
        } catch (err: any) {
          console.error('Error during stream iteration:', err);
          controller.enqueue(
            encoder.encode(
              `\n\n⚠️ **Stream Error**: ${err?.message || 'Streaming failed. Please verify your Gemini API key.'}`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/chat route:', error);
    const errorMessage = error?.message || 'Failed to connect to Google Gemini API.';
    return new Response(
      `⚠️ **API Error**: ${errorMessage}\n\nPlease verify that your API key from [Google AI Studio](https://aistudio.google.com/app/apikey) is valid and active.`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }
    );
  }
}
