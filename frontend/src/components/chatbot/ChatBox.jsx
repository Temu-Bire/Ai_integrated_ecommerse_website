import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import Message from './Message';

// Quick suggestions for the user to click
const SUGGESTIONS = [
  "Recommend audio gear",
  "How does local AI work?",
  "Desk setup ideas"
];

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Hello! I am Aether's localized Neural Engine. How can I assist you with your smart device setup today?" }
  ]);

  const messagesEndRef = useRef(null);

  // Auto-scrolls to the bottom whenever a new message is sent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulates a smart AI response
  const handleBotResponse = (userQuery) => {
    setTimeout(() => {
      let botText = "I processed your request, but my model requires integration with the backend API to retrieve exact live catalogs.";
      
      const query = userQuery.toLowerCase();
      if (query.includes('audio') || query.includes('headphones')) {
        botText = "I highly recommend the NeuralBuds Pro ($189). They feature advanced on-device adaptive noise cancellation that realign dynamically to your ear canal.";
      } else if (query.includes('how') || query.includes('local')) {
        botText = "Our hardware implements private NPU cores. This keeps your biometric data, smart home schedules, and speech processing fully local and secure.";
      } else if (query.includes('desk') || query.includes('setup')) {
        botText = "For an ideal productivity setup, team up our Apex AI Smart Hub ($149) with the Cognitive Vision Webcam ($220) to automate workspace ambient levels and video scaling.";
      }

      setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: botText }]);
    }, 1000);
  };

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Trigger AI loading state & response
    handleBotResponse(textToSend);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* --- COLLAPSED TOGGLE BUTTON --- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full shadow-lg shadow-cyan-500/10 transition-all duration-300 hover:scale-105"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm">Ask Aether AI</span>
        </button>
      )}

      {/* --- CHATBOX INTERFACE --- */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Chat Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-1">
                  Aether Engine <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h3>
                <span className="text-[10px] text-slate-500">Local Neural Cores Active</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Suggested Prompts</span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-[11px] text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-500/50 rounded-lg px-2.5 py-1 text-left transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input Panel */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask setup recommendations..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="submit"
                className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors flex items-center justify-center shrink-0"
                aria-label="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}