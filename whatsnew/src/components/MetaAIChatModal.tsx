import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  KeyRound,
  Bot,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { User } from '../types';

interface MetaAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  metaAiConfig: {
    mode: 'disabled' | 'enabled_free' | 'enabled_user_key';
    promptNotice?: string;
  };
  userApiKey: string;
  onSaveUserApiKey: (key: string) => void;
  onSendMessageToChat?: (text: string) => void;
}

interface AIMessage {
  id: string;
  sender: 'user' | 'meta-ai';
  text: string;
  timestamp: string;
}

const SAMPLE_PROMPTS = [
  'Schreibe eine freundliche Nachricht für einen Geburtstag',
  'Erkläre den Unterschied zwischen HTTP und HTTPS',
  'Übersetze ins Spanische: "Vielen Dank für deine Hilfe"',
  'Gib mir 3 kreative Ideen für ein Wochenende in Berlin',
];

export const MetaAIChatModal: React.FC<MetaAIChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  metaAiConfig,
  userApiKey,
  onSaveUserApiKey,
  onSendMessageToChat,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      sender: 'meta-ai',
      text: 'Hallo! Ich bin Meta AI, dein intelligenter Assistent für WhatsApp. Wie kann ich dir heute helfen?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyInput, setKeyInput] = useState(userApiKey);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setKeyInput(userApiKey);
  }, [userApiKey]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    if (metaAiConfig.mode === 'disabled') {
      setErrorNotice('Meta AI ist aktuell vom Administrator deaktiviert.');
      return;
    }

    if (metaAiConfig.mode === 'enabled_user_key' && !userApiKey.trim()) {
      setShowKeyConfig(true);
      setErrorNotice('Der Administrator verlangt deinen eigenen Gemini API-Key.');
      return;
    }

    setErrorNotice(null);
    const userMsg: AIMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/meta-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          userApiKey: metaAiConfig.mode === 'enabled_user_key' ? userApiKey : undefined,
          history: messages.slice(-8).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Antwort konnte nicht geladen werden.');
      }

      const aiMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        sender: 'meta-ai',
        text: data.reply || 'Keine Antwort erhalten.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setErrorNotice(err.message || 'Verbindungsfehler zur AI');
      const errorAiMsg: AIMessage = {
        id: `ai_err_${Date.now()}`,
        sender: 'meta-ai',
        text: `⚠️ Hinweis: ${err.message || 'Meta AI ist momentan nicht erreichbar.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-[#efeae2] rounded-2xl shadow-2xl w-full max-w-xl h-[90vh] max-h-[700px] flex flex-col overflow-hidden border border-[#d1d7db] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#008069] text-white p-3.5 flex items-center justify-between shadow-xs select-none">
          <div className="flex items-center gap-3">
            {/* Meta AI iridescent ring icon */}
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-fuchsia-500 p-0.5 flex items-center justify-center shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide">Meta AI</h3>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-semibold text-white/90">
                  {metaAiConfig.mode === 'enabled_user_key' ? 'Eigener Key' : 'Integrierter Assistent'}
                </span>
              </div>
              <p className="text-[11px] text-white/80">Mit fortschrittlicher Gemini AI-Intelligenz</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {metaAiConfig.mode === 'enabled_user_key' && (
              <button
                type="button"
                onClick={() => setShowKeyConfig((p) => !p)}
                className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                  showKeyConfig ? 'bg-white/20' : ''
                }`}
                title="API-Schlüssel anpassen"
              >
                <KeyRound className="w-4.5 h-4.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome_reset',
                    sender: 'meta-ai',
                    text: 'Chat zurückgesetzt. Wie kann ich dir heute weiterhelfen?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              title="Chat leeren"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Key Configuration Drawer if required */}
        {showKeyConfig && (
          <div className="bg-white border-b border-[#d1d7db] p-4 text-xs space-y-3 animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111b21] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[#008069]" />
                Dein Gemini API-Schlüssel
              </span>
              <button
                type="button"
                onClick={() => setShowKeyConfig(false)}
                className="text-[#667781] hover:text-[#111b21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-[#667781] leading-relaxed">
              Der Administrator hat festgelegt, dass Nutzer ihren eigenen Google Gemini API-Schlüssel verwenden.
              Dein Schlüssel wird sicher lokal im Browser aufbewahrt.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-1.5 bg-[#f0f2f5] border border-[#d1d7db] rounded-lg text-xs outline-none focus:border-[#008069]"
              />
              <button
                type="button"
                onClick={() => {
                  onSaveUserApiKey(keyInput.trim());
                  setShowKeyConfig(false);
                }}
                className="px-4 py-1.5 bg-[#008069] text-white font-semibold rounded-lg hover:bg-[#00a884] transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        )}

        {/* Error / Admin notice */}
        {errorNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button type="button" onClick={() => setErrorNotice(null)} className="text-amber-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-xs text-xs relative ${
                    isMe
                      ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs'
                      : 'bg-white text-[#111b21] rounded-tl-xs border border-[#d1d7db]/60'
                  }`}
                >
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-indigo-600">
                      <Sparkles className="w-3 h-3" />
                      <span>Meta AI</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap leading-relaxed select-text">{msg.text}</div>

                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781]">
                    <span>{msg.timestamp}</span>
                    {!isMe && (
                      <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-[#111b21]"
                          title="Kopieren"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-[#008069]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        {onSendMessageToChat && (
                          <button
                            type="button"
                            onClick={() => {
                              onSendMessageToChat(msg.text);
                              onClose();
                            }}
                            className="hover:text-[#008069] font-medium"
                            title="In aktuellen Chat übernehmen"
                          >
                            In Chat
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#54656f] bg-white border border-[#d1d7db]/60 rounded-2xl rounded-tl-xs px-3.5 py-2.5 max-w-[200px]">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[11px]">Meta AI antwortet...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 overflow-x-auto flex gap-2 shrink-0 select-none no-scrollbar">
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                className="text-[11px] px-3 py-1.5 bg-white hover:bg-white/80 border border-[#d1d7db] text-[#111b21] rounded-full whitespace-nowrap shadow-2xs transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-[#f0f2f5] border-t border-[#d1d7db] flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Frage Meta AI etwas..."
            className="flex-1 px-4 py-2 text-xs bg-white rounded-full border border-[#d1d7db] focus:border-[#008069] outline-none text-[#111b21]"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008069] disabled:opacity-50 text-white flex items-center justify-center transition-colors shadow-sm shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
