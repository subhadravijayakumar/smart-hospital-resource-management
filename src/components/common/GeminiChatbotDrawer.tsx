import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Sparkles, MessageSquare, X, Send, Bot, User as UserIcon, Loader2, Minimize2, Maximize2 } from 'lucide-react';

export const GeminiChatbotDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: 'Hello. I am AURA Clinical AI Assistant. How can I assist you with clinical triage protocols, bed allocations, or resource management today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Explain Emergency Severity Index (ESI) levels',
    'How does Greedy Bed Allocation prioritize patients?',
    'What are the ICU step-down criteria?',
    'Check high-acuity nurse-to-patient staffing ratio'
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const newHistory = [...messages, { role: 'user' as const, text: query }];
    setMessages(newHistory);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await api.sendAiChat(query, messages);
      setMessages([...newHistory, { role: 'model', text: res.reply }]);
    } catch (err: unknown) {
      setMessages([
        ...newHistory,
        { role: 'model', text: `Clinical Assistant Error: ${(err as Error).message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 flex items-center gap-2.5 text-xs font-semibold transition-all transform hover:scale-105 border border-slate-700 ${
          isOpen ? 'hidden' : 'flex'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <Sparkles className="w-4 h-4 text-teal-400" />
        <span>AURA Clinical AI</span>
      </button>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>AURA Clinical Assistant</span>
                  <span className="text-[10px] font-mono font-medium text-teal-400 bg-teal-950 px-1 rounded">Gemini</span>
                </div>
                <div className="text-[10px] text-slate-400">Hospital Intelligence &amp; Triage Co-Pilot</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar shrink-0">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-600 rounded-md border border-slate-200 transition-colors shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/40">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'model' && (
                  <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[82%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2.5 items-center text-slate-500 text-xs pl-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>AURA is reasoning...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AURA about bed policy, triage, or vitals..."
              className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-40 transition-colors shadow-2xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
