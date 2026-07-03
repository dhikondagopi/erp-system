import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, RefreshCw, AlertCircle, ChevronRight, MessageSquare } from 'lucide-react';
import aiApi from '../../../services/aiApi';

/**
 * Renders structured basic Markdown elements returned by Gemini text outputs.
 */
const MarkdownRenderer = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  const renderedElements = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('|')) {
      inTable = true;
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      if (line.includes('---')) {
        continue;
      }
      
      if (tableHeaders.length === 0) {
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      renderedElements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-lg border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs bg-slate-950/40">
            <thead className="bg-slate-900/80 font-semibold text-slate-200">
              <tr>
                {tableHeaders.map((h, idx) => (
                  <th key={idx} className="px-4 py-2 border-b border-slate-800">{h.replace(/\*\*/g, '')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/20">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2">
                      {cell.startsWith('**') && cell.endsWith('**') ? 
                        <strong>{cell.replace(/\*\*/g, '')}</strong> : 
                        cell
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }

    if (line.startsWith('###')) {
      renderedElements.push(
        <h4 key={i} className="text-sm font-bold text-white mt-4 mb-2 tracking-wide flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-violet-400 font-black shrink-0" />
          {line.replace('###', '').trim()}
        </h4>
      );
    } else if (line.startsWith('##')) {
      renderedElements.push(
        <h3 key={i} className="text-base font-extrabold text-white mt-5 mb-2.5">
          {line.replace('##', '').trim()}
        </h3>
      );
    } else if (line.startsWith('#')) {
      renderedElements.push(
        <h2 key={i} className="text-lg font-black text-white mt-6 mb-3">
          {line.replace('#', '').trim()}
        </h2>
      );
    } else if (line.startsWith('*') || line.startsWith('-')) {
      renderedElements.push(
        <ul key={i} className="list-disc pl-5 my-1.5 space-y-1 text-slate-300 text-xs">
          <li>{line.substring(1).trim().replace(/\*\*/g, '')}</li>
        </ul>
      );
    } else if (line !== '') {
      const formattedText = line.split('**').map((part, index) => {
        return index % 2 === 1 ? <strong key={index} className="text-white">{part}</strong> : part;
      });

      renderedElements.push(
        <p key={i} className="text-xs text-slate-300 leading-relaxed my-2">
          {formattedText}
        </p>
      );
    }
  }

  if (inTable && tableHeaders.length > 0) {
    renderedElements.push(
      <div key="table-trail" className="overflow-x-auto my-3 rounded-lg border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-left text-xs bg-slate-950/40">
          <thead className="bg-slate-900/80 font-semibold text-slate-200">
            <tr>
              {tableHeaders.map((h, idx) => (
                <th key={idx} className="px-4 py-2 border-b border-slate-800">{h.replace(/\*\*/g, '')}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-slate-300">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-900/20">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2">
                    {cell.startsWith('**') && cell.endsWith('**') ? 
                      <strong>{cell.replace(/\*\*/g, '')}</strong> : 
                      cell
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="space-y-1">{renderedElements}</div>;
};

const AiChatPanel = () => {
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I am your AI ERP Chat Copilot. I analyze inventory parameters, production stages, sales velocity, and procurement lead times from the live database.

How can I assist you today? Click any query below or type your custom instruction.`,
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const quickPrompts = [
    "Show low stock products",
    "What are today's sales?",
    "Which manufacturing orders are pending?",
    "Which purchase orders are delayed?",
    "What products need replenishment?"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const sendChatMessage = async (msgText) => {
    if (!msgText.trim()) return;

    const userMsg = { sender: 'user', text: msgText, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await aiApi.sendChatMessage(msgText);
      const aiMsg = { 
        sender: 'ai', 
        text: response.response, 
        timestamp: new Date() 
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const apiErrorMsg = err.response?.data?.message || 'Failed to process chat request.';
      const errorMsg = { 
        sender: 'ai', 
        text: `**Error**: ${apiErrorMsg}`, 
        timestamp: new Date() 
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-210px)] min-h-[500px]">
      
      {/* Left Column: Messages Thread */}
      <div className="lg:col-span-3 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-xl overflow-hidden shadow-xl">
        {/* Messages viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {chatMessages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                msg.sender === 'user'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow shadow-violet-500/20'
              }`}>
                {msg.sender === 'user' ? 'ME' : 'AI'}
              </div>

              {/* Bubble */}
              <div className={`rounded-2xl px-4 py-3 border text-sm ${
                msg.sender === 'user'
                  ? 'bg-slate-950/60 border-slate-800 text-slate-200 rounded-tr-none'
                  : 'bg-slate-900/80 border-slate-800 text-slate-100 rounded-tl-none shadow-md'
              }`}>
                <MarkdownRenderer text={msg.text} />
                
                <span className="block text-[9px] text-slate-500 mt-1.5 text-right font-medium">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex gap-3 mr-auto max-w-[80%] animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 shrink-0 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-400 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-none px-4 py-3 border border-slate-800 bg-slate-900/40 space-y-2 w-48 animate-pulse">
                <div className="h-2 w-full bg-slate-800 rounded" />
                <div className="h-2 w-5/6 bg-slate-800 rounded" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            sendChatMessage(chatInput);
          }} 
          className="border-t border-slate-850 p-4 bg-slate-950/40 flex items-center gap-3"
        >
          <input
            type="text"
            value={chatInput}
            disabled={chatLoading}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about inventory, today's sales, pending manufacturing, or low stock..."
            className="flex-1 bg-slate-950/85 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-55"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg active:scale-95 transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right Column: Prompts List & Info */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-xl space-y-4 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            Suggested Queries
          </h3>
          <div className="space-y-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                disabled={chatLoading}
                onClick={() => sendChatMessage(prompt)}
                className="w-full text-left text-xs font-semibold text-slate-350 hover:text-violet-305 hover:bg-violet-955/20 hover:border-violet-900/35 px-4 py-3 rounded-xl border border-slate-800 bg-slate-955/30 transition-all duration-205 active:scale-[0.98]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 backdrop-blur-xl text-xs space-y-3 text-slate-400">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
            Live Query Guard
          </h4>
          <p className="leading-relaxed font-semibold">
            Every chat prompt dynamically classifies query intents and runs target PostgreSQL checks against active tables. 
            No mock datasets are utilized.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiChatPanel;
