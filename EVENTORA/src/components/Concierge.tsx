import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, X, MessageSquare, Bot, Volume2, VolumeX } from 'lucide-react';
import { useAI, Message } from '../hooks/useAI';
import { useWedding } from '../contexts/WeddingContext';
import { useMojo } from '../contexts/MojoContext';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

export const Concierge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isMuted, toggleMute } = useMojo();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Namaste. I am Mojo. At your service for your luxury wedding orchestration." }
  ]);
  const { sendMessage, loading } = useAI();
  const { currentWedding } = useWedding();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-concierge', handleOpen);
    return () => window.removeEventListener('open-concierge', handleOpen);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window && !isMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        // Look for Indian English female voices first for the theme, then others
        const preferredVoice = 
          voices.find(v => v.lang.includes('en-IN') && v.name.toLowerCase().includes('female')) ||
          voices.find(v => v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female')) ||
          voices.find(v => v.name.toLowerCase().includes('samantha')) ||
          voices.find(v => v.name.toLowerCase().includes('victoria')) ||
          voices.find(v => v.name.toLowerCase().includes('female')) ||
          voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google'));

        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.rate = 0.85; // Calm but not dragging
        utterance.pitch = 1.15; // Pleasant, sweet, but not squeaky
        utterance.volume = 0.6; // Clear but polite
        window.speechSynthesis.speak(utterance);
      };
      if (window.speechSynthesis.getVoices().length > 0) setVoice();
      else window.speechSynthesis.onvoiceschanged = setVoice;
    }
  };

  const saveToFirestore = async (newMessages: Message[]) => {
    if (!currentWedding || !auth.currentUser) return;
    const path = `weddings/${currentWedding.id}/ai_chats`;
    try {
      await addDoc(collection(db, path), {
        weddingId: currentWedding.id,
        userId: auth.currentUser.uid,
        weddingSnapshot: currentWedding,
        messages: newMessages.map(m => ({
          ...m,
          timestamp: new Date().toISOString()
        })),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      // Just log, don't break the UI for this
      console.error("Failed to save chat:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', text: input };
    const updatedMessages: Message[] = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    const response = await sendMessage(input, messages, currentWedding);
    const modelMessage: Message = { role: 'model', text: response };
    const finalMessages: Message[] = [...updatedMessages, modelMessage];
    setMessages(finalMessages);
    speakResponse(response);
    saveToFirestore(finalMessages);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-50 rounded-full w-16 h-16 flex flex-col items-center justify-center p-0 shadow-2xl transition-all duration-500 overflow-hidden group ${isOpen ? 'bg-gold-950 text-white' : 'bg-white border-2 border-saffron-500 text-saffron-600 hover:scale-110 active:scale-95'}`}
      >
        <div className="absolute inset-0 bg-saffron-500 opacity-0 group-hover:opacity-5 animate-pulse" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex flex-col items-center">
              <Bot className="w-6 h-6" />
              <span className="text-[7px] uppercase font-bold tracking-tighter mt-1">Chat Mojo</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 z-50 w-full max-w-[400px] h-[600px] flex flex-col bg-white border border-gold-500/20 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-gold-100 bg-gold-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-saffron-500/10 border border-saffron-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-saffron-600" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-gold-950 font-bold">Mojo</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">Luxury Digital Assistant</p>
                </div>
              </div>
              <button 
                onClick={toggleMute}
                className={`p-2 rounded-full transition-colors ${isMuted ? 'text-gold-300' : 'text-saffron-600 bg-saffron-50'}`}
                title={isMuted ? "Unmute Mojo" : "Mute Mojo"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-ivory">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gold-950 text-white' 
                      : 'bg-white border border-gold-100 text-gold-950'
                  }`}>
                    <div className={`prose prose-sm ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                       <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gold-50/50 p-4 rounded-2xl flex items-center gap-1 border border-gold-100">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 12, 4] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 0.8, 
                          delay: i * 0.1,
                          ease: "easeInOut"
                        }}
                        className="w-1 bg-saffron-500 rounded-full"
                      />
                    ))}
                    <span className="text-[8px] uppercase font-black text-gold-400 ml-2 tracking-widest">Listening</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-gold-100">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Mojo anything..."
                  className="w-full bg-gold-50 border border-gold-200 focus:border-saffron-500/50 outline-none rounded-full py-3 px-6 pr-12 text-sm placeholder:text-gold-400 transition-all text-gold-950 font-medium"
                />
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-saffron-600 hover:text-saffron-500 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
