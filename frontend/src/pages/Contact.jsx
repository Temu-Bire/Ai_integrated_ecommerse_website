import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API pipeline integration
    setSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-3xl font-black text-white tracking-tight">Contact Us</h1>
          <p className="text-slate-500 text-sm mt-1">Have questions about our products or your order? We're here to help. Send us a message and our team will get back to you as soon as possible.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          
          {/* Left: Quick Node Metrics (2 Columns) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Get in Touch</h3>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-cyan-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-500">Email</span>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">support@xelectronics.com</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-cyan-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-500">Phone</span>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">+1 (800) 555-0199</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-cyan-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-500">Store Address</span>
                    <p className="text-xs text-slate-300 mt-0.5">Debre Berhan, Amhara, Ethiopia</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Quick Helper Banner */}
            <div className="bg-cyan-950/20 border border-cyan-500/20 p-6 rounded-xl flex gap-3">
              <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Need Quick Help?</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Use our AI Assistant to get instant answers about products, recommendations, and common troubleshooting before contacting our support team.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Interactive Forms Box (3 Columns) */}
          <div className="md:col-span-3 bg-slate-900 border border-slate-850 rounded-2xl p-8 relative">
            
            {submitted ? (
              <div className="absolute inset-0 bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <Send className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Message Sent Successfully</h3>
                <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">
                  Thank you for contacting us. Our support team has received your message and will respond within 24 hours.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300"
                >
                  Send Another Message
                </button>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Your Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter your name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-cyan-500/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="Enter your email address" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-cyan-500/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Message</label>
                <textarea 
                  rows="4"
                  required
                  placeholder="Write your message here..." 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-cyan-500/40 resize-none"
                ></textarea>
              </div>

              <button className="w-full mt-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2">
                <Send className="w-3.5 h-3.5" /> Send Message
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}