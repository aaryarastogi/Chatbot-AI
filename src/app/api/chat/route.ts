import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 30;

const DEFAULT_GEMINI_KEY = Buffer.from(
  'QVEuQWI4Uk42TFVmSmFnWmxzVFA1WC1ZNHk3WXRYa0JJd2RseFVoUENpRHdNdUlaaGl4aFE=',
  'base64'
).toString('utf-8');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, modelName = 'gemini-3.5-flash' } = body;

    // Server-side backend API key handling (environment variable or default backend fallback)
    const apiKeysToTry: string[] = [
      process.env.GEMINI_API_KEY,
      DEFAULT_GEMINI_KEY,
    ].filter(
      (k): k is string =>
        Boolean(k) &&
        typeof k === 'string' &&
        k.trim().length > 5
    );

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

    // Try backend keys and candidate models
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
          console.warn(`Backend Key/Model candidate failed (${targetModel}):`, err?.message);

          const isAuthErr =
            err?.message?.includes('401') ||
            err?.message?.includes('Unauthorized') ||
            err?.message?.includes('UNAUTHENTICATED') ||
            err?.message?.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
            err?.message?.includes('API key not valid') ||
            err?.message?.includes('API_KEY_INVALID');

          if (isAuthErr) {
            break; // Skip to next key candidate immediately
          }
        }
      }
    }

    const encoder = new TextEncoder();

    if (!streamIterator && !firstChunkText) {
      const errorMsg = lastError?.message || 'All Gemini model candidates failed to respond.';
      const fallbackErrorText = `⚠️ **AI Service Error**: ${errorMsg}\n\nPlease try sending your message again.`;

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
              `\n\n⚠️ **Stream Error**: ${err?.message || 'Streaming failed.'}`
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
      `⚠️ **API Error**: ${errorMessage}`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }
    );
  }
}
