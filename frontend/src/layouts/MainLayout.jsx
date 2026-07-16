import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ChatBox from '../components/chatbot/ChatBox';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-900">
      {/* Persistent Global Navbar */}
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Floating AI Chatbot Widget */}
      <ChatBox />

      {/* Persistent Global Footer */}
      <Footer />
    </div>
  );
}