import { useState } from 'react';

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export const useAI = () => {
  const [loading, setLoading] = useState(false);

  const sendMessage = async (prompt: string, history: Message[], weddingContext?: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history, weddingContext }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('AI hook error:', error);
      return "I apologize, but I'm having trouble connecting to my creative suite at the moment. How else can I assist you with your wedding planning?";
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};
