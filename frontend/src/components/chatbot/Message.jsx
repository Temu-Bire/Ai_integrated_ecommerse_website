import React from 'react';
import { Bot, User } from 'lucide-react';

export default function Message({ message }) {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      
      {/* Bot Avatar */}
      {isBot && (
        <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
          isBot
            ? 'bg-slate-900 border border-slate-800 text-slate-100'
            : 'bg-cyan-500 text-slate-950 font-medium'
        }`}
      >
        {message.text}
      </div>

      {/* User Avatar */}
      {!isBot && (
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
          <User className="w-4 h-4" />
        </div>
      )}
      
    </div>
  );
}