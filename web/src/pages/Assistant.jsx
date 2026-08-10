import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles } from 'lucide-react';
import api from '../lib/api.js';
import { Card, Badge } from '../components/ui.jsx';

const SUGGESTIONS = [
  'How many students have overdue fees?',
  'Draft a polite fee reminder message.',
  'Which inventory items need restocking?',
  "Summarise today's priorities for the principal.",
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Wellspire Copilot. Ask me about students, fees, inventory or anything happening at school." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { api.get('/ai/status').then(setStatus).catch(() => {}); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const history = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: 'user', content }]);
    setInput(''); setLoading(true);
    try {
      const r = await api.post('/ai/chat', { message: content, history });
      setMessages((m) => [...m, { role: 'assistant', content: r.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Sorry — ${e.message}` }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white"><Bot className="h-5 w-5" /></div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Copilot</h1>
          <p className="text-xs text-slate-400">Grounded in your live school data</p>
        </div>
        {status && <Badge className="ml-auto" color={status.openrouter ? 'emerald' : 'amber'}>{status.openrouter ? status.model : 'Add API key'}</Badge>}
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${m.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-brand-100 text-brand-700'}`}>
                {m.role === 'user' ? 'You' : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-100 text-brand-700"><Bot className="h-4 w-4" /></div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-5 pb-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200">
                <Sparkles className="h-3 w-3" /> {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2">
            <input
              className="input"
              placeholder="Ask anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="btn-primary !px-3" onClick={() => send()} disabled={loading || !input.trim()}><Send className="h-4 w-4" /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}
