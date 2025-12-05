import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Bot, X, Send, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../types';

const OPENROUTER_API_KEY = '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';
const SITE_URL = 'https://hostelledge.netlify.app'; // Update with your actual URL
const SITE_NAME = 'Hostel Kharcha Manager';

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I am ledgeAI, created by Mian Khizar. Ask me about your hostel expenses, meals, or budgets.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const fetchContextData = async () => {
    const { data: expenses } = await supabase.from('expenses').select('*').limit(50);
    const { data: meals } = await supabase.from('meals').select('*').limit(20);
    const { data: friends } = await supabase.from('friends').select('*');
    const { data: budgets } = await supabase.from('budgets').select('*');
    const { data: weekly } = await supabase.from('weekly_money').select('*');

    const totalWeekly = weekly?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    
    // Format data for AI
    const context = `
      CURRENT DATE: ${new Date().toDateString()}
      
      FINANCIAL SNAPSHOT:
      - Total Budget Added: PKR ${totalWeekly}
      
      RECENT EXPENSES:
      ${expenses?.map(e => `- ${e.date.split('T')[0]}: ${e.title} (${e.category}) - PKR ${e.amount}`).join('\n')}
      
      MEAL HISTORY:
      ${meals?.map(m => `- ${m.date.split('T')[0]}: ${m.meal_type} cooked by ${m.cooked}, Cost: ${m.cost}`).join('\n')}
      
      FRIEND TRANSACTIONS:
      ${friends?.map(f => `- ${f.name}: ${f.type === 'borrowed' ? 'Owes us' : 'Paid/Deposited'} PKR ${f.amount} (${f.status})`).join('\n')}
      
      BUDGETS:
      ${budgets?.map(b => `- ${b.name}: Limit PKR ${b.amount}`).join('\n')}
    `;
    return context;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const dbContext = await fetchContextData();

      const systemPrompt = `
        You are ledgeAI, an intelligent financial assistant for the "Hostel Kharcha Manager" app.
        You were created by Mian Khizar.
        
        YOUR GOAL:
        Answer user questions strictly based on the provided database context.
        
        DATABASE CONTEXT:
        ${dbContext}
        
        RULES:
        1. If the user asks about expenses, meals, debts, budget, or anything related to the data provided, answer helpfully.
        2. Use Markdown formatting for clarity:
           - Use **bold** for amounts and names.
           - Use lists (- item) for breaking down expenses.
           - Use ### Headings for sections.
        3. GUARDRAIL: If the user asks ANY question unrelated to this data (e.g., general knowledge, coding, jokes, life advice, politics, weather), you must NOT answer it. Instead, reply EXACTLY with this phrase:
           "Khizar not allowed me contact him for this"
           
        Do not apologize. Do not provide extra info for unrelated queries.
      `;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
          "messages": [
            { "role": "system", "content": systemPrompt },
            ...messages.filter(m => m.role !== 'system'),
            userMessage
          ]
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const aiResponse = data.choices[0].message.content;
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't connect to the server." }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error processing request." }]);
    } finally {
      setLoading(false);
    }
  };

  // Simple Markdown Renderer
  const renderMarkdown = (text: string) => {
    // 1. Headers (### Header)
    let html = text.replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mt-2 mb-1 text-red-400">$1</h3>');
    // 2. Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white font-bold">$1</strong>');
    // 3. Lists (- item)
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-zinc-300">$1</li>');
    // 4. Line breaks
    html = html.replace(/\n/gim, '<br />');
    
    return { __html: html };
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-50 p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full shadow-lg hover:scale-105 transition-transform duration-200 group"
      >
        {isOpen ? <X className="text-white" /> : <Bot className="text-white" />}
        {!isOpen && (
           <span className="absolute -top-1 -right-1 flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
           </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 sm:bottom-28 right-0 sm:right-4 w-full sm:w-96 h-[80vh] sm:h-[600px] bg-zinc-900 border border-zinc-800 sm:rounded-2xl shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-10">
          
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 rounded-t-2xl flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Sparkles size={20} className="text-indigo-400" />
            </div>
            <div>
                <h3 className="font-bold text-white flex items-center gap-2">ledgeAI <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded">BETA</span></h3>
                <p className="text-[10px] text-zinc-400">Created by Mian Khizar</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-zinc-800 text-zinc-300 rounded-bl-none border border-zinc-700'
                  }`}
                >
                    {msg.role === 'assistant' ? (
                        <div dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                    ) : (
                        msg.content
                    )}
                </div>
              </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-zinc-800 p-3 rounded-2xl rounded-bl-none border border-zinc-700 flex items-center gap-2">
                        <Loader2 className="animate-spin text-indigo-400" size={16} />
                        <span className="text-xs text-zinc-400">Thinking...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-950/50 rounded-b-2xl">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about expenses..."
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[9px] text-zinc-600">AI can make mistakes. Check important info.</p>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
