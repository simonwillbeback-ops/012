import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { chatWithGuide } from '../services/gemini';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello. I am your mindfulness companion. How are you feeling today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await chatWithGuide(history, input);

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I'm listening...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having trouble connecting. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-2 shrink-0">
        <Sparkles className="w-5 h-5 text-cyan-400" />
        <h3 className="font-semibold text-white">Mindful Guide (Free AI)</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-cyan-600' : 'bg-slate-700'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${
              msg.role === 'user' 
                ? 'bg-cyan-600/20 text-cyan-50 border border-cyan-500/30 rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm ml-12">
            <span className="animate-pulse">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 md:p-4 bg-slate-800/50 border-t border-slate-700 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about mindfulness..."
            className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-500 appearance-none text-sm md:text-base"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;