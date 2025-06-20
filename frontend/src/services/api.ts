// API client for your Express backend
class ApiClient {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  async getModels() {
    const response = await fetch(`${this.baseUrl}/chat/models`);
    return response.json();
  }

  async streamChatCompletion(
    messages: any[],
    model: string,
    onChunk: (content: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, model }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

export const apiClient = new ApiClient();
