import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
  Star,
  Check,
  Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';

const QUICK_PROMPTS = [
  "Recommend noise cancelling headphones",
  "Compare ThinkPad vs ApexBook",
  "What is your return & warranty policy?",
  "Check my order status"
];

export default function ChatBox() {
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am Nova, your AI hardware concierge. I can search live inventory, compare laptop workstations, check real-time stock, or answer policy questions. What are you looking for today?",
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTool]);

  // Listen for custom trigger from product details page
  useEffect(() => {
    function handleAskEvent(e) {
      setIsOpen(true);
      if (e.detail?.prompt) {
        handleSendMessage(e.detail.prompt);
      }
    }
    window.addEventListener('ai-ask-product', handleAskEvent);
    return () => window.removeEventListener('ai-ask-product', handleAskEvent);
  }, []);

  const handleSendMessage = async (textToSend) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isStreaming) return;

    setInput('');
    const userMsgId = 'usr_' + Date.now();
    const asstMsgId = 'asst_' + Date.now();

    // 1. Add user message and empty assistant placeholder
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: prompt },
      { id: asstMsgId, role: 'assistant', content: '', cards: [] },
    ]);

    setIsStreaming(true);
    setActiveTool(null);

    // Retrieve or create persistent session ID
    let sessionId = localStorage.getItem('novamart_chat_session');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('novamart_chat_session', sessionId);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('AI Assistant connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep partial line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.substring(6).trim();
            if (!raw) continue;
            try {
              const event = JSON.parse(raw);
              if (event.type === 'token') {
                setActiveTool(null);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === asstMsgId
                      ? { ...msg, content: msg.content + event.content }
                      : msg
                  )
                );
              } else if (event.type === 'tool_call') {
                setActiveTool(event.name.replace(/_/g, ' '));
              } else if (event.type === 'product_cards') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === asstMsgId
                      ? { ...msg, cards: [...(msg.cards || []), ...event.cards] }
                      : msg
                  )
                );
              } else if (event.type === 'done') {
                setIsStreaming(false);
                setActiveTool(null);
              }
            } catch (err) {
              console.error('Error parsing SSE event:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === asstMsgId
            ? { ...msg, content: "I am experiencing temporary connection latency. You can also search products directly in the top navigation bar." }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      setActiveTool(null);
    }
  };

  const handleAddCardToCart = async (card) => {
    try {
      // Find default variant or product ID
      await addToCart(card.id, 1);
      toast.success(`Added ${card.title} to your cart!`);
    } catch (e) {
      toast.error('Could not add item to cart directly.');
    }
  };

  const handleClearConversation = () => {
    localStorage.removeItem('novamart_chat_session');
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Conversation cleared. How can I help you discover hardware today?",
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Trigger Button */}
      {!isOpen && (
        <button
          id="chat-trigger-btn"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-bold shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950/20 flex items-center justify-center text-slate-950">
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </div>
          <span className="text-sm">Ask AI Concierge</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[380px] sm:w-[440px] h-[600px] max-h-[85vh] bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-md">
                <Bot className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  Nova AI Shopping Assistant
                </h3>
                <p className="text-[11px] text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Grounded Catalog Access
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearConversation}
                title="Clear conversation"
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-sm ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`space-y-3 max-w-[85%]`}>
                  <div
                    className={`p-3.5 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-cyan-500 text-slate-950 font-medium ml-auto rounded-tr-xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs leading-relaxed'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Render Structured Product Cards if Returned by Tool */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {msg.cards.map((c, i) => (
                        <div
                          key={i}
                          className="p-3 bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl flex items-center gap-3 transition-colors shadow-md"
                        >
                          <img
                            src={c.primary_image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                            alt={c.title}
                            className="w-14 h-14 rounded-xl object-cover bg-slate-950 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-xs truncate">{c.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-cyan-400">{c.price}</span>
                              {c.rating && (
                                <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-400" /> {c.rating}
                                </span>
                              )}
                            </div>
                          </div>
                          <Link
                            to={`/products/${c.slug || c.id}`}
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Tool Execution Pulse Indicator */}
            {activeTool && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-3 py-2 rounded-xl animate-pulse">
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Executing: {activeTool}...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-slate-900 bg-slate-950 flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                disabled={isStreaming}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-cyan-400 whitespace-nowrap rounded-lg border border-slate-800 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={isStreaming ? 'Nova is formulating response...' : 'Ask about specs, orders, or stock...'}
              disabled={isStreaming}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
