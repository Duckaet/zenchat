import OpenAI from 'openai';
import 'dotenv/config'; // Ensure environment variables are loaded

export class OpenRouterService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('Missing OPENROUTER_API_KEY in environment variables.');
    }

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.YOUR_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Chat App',
      },
    });
  }
    async streamCompletion(
    messages: any[], 
    model: string, 
    onChunk: (chunk: any) => void
    ) {
    try {
        const stream = await this.client.chat.completions.create({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
        });

        for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
            onChunk({ content, type: 'content' });
        }
        }
    } catch (error) {
        console.error(`OpenRouter error with model ${model}:`, error);
        
        if (error instanceof Error && (error.message.includes('rate limit') || error.message.includes('unavailable'))) {
        throw new Error(`Model ${model} is currently unavailable.`);
        }
        
        throw error;
    }
    }


}
