import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  X,
  Image,
  Video,
  Mic,
  FileText,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { StorageBreakdown } from '../types';
import { WhatsAppAvatar } from './WhatsAppAvatar';

interface StorageDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageDataModal: React.FC<StorageDataModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<StorageBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearingChatId, setClearingChatId] = useState<string | null>(null);
  const [clearingConfirm, setClearingConfirm] = useState<{ chatId: string; chatName: string } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/storage-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching storage stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const handleClearMedia = async (chatId: string) => {
    try {
      setClearingChatId(chatId);
      const res = await fetch('/api/storage-clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, type: 'media' }),
      });
      if (res.ok) {
        await fetchStats();
      }
    } catch (e) {
      console.error('Error clearing media:', e);
    } finally {
      setClearingChatId(null);
      setClearingConfirm(null);
    }
  };

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const total = stats?.totalBytes || 1;
  const imgPct = Math.round(((stats?.mediaBreakdown.images || 0) / total) * 100);
  const audioPct = Math.round(((stats?.mediaBreakdown.audio || 0) / total) * 100);
  const docsPct = Math.round(((stats?.mediaBreakdown.documents || 0) / total) * 100);
  const msgPct = Math.round(((stats?.mediaBreakdown.messages || 0) / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-[#e9edef] dark:border-[#222e35] flex flex-col max-h-[88vh]">
        {/* Top Header */}
        <div className="bg-[#008069] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">Speicher und Daten</h2>
              <p className="text-xs text-white/80">Speicherplatzverwaltung für Chats & Medien</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#111b21] dark:text-[#e9edef]">
          {/* Storage Overview Bar */}
          <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-4 rounded-2xl border border-[#d1d7db]/50 dark:border-[#2a3942] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0]">
                Verwendeter Speicher
              </span>
              <span className="text-sm font-bold text-[#00a884]">
                {loading ? 'Berechne...' : formatBytes(stats?.totalBytes || 0)}
              </span>
            </div>

            {/* Segmented Color Bar */}
            <div className="h-3.5 w-full bg-[#d1d7db]/40 dark:bg-[#111b21] rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${Math.max(5, imgPct)}%` }}
                className="bg-[#00a884] h-full"
                title={`Fotos: ${formatBytes(stats?.mediaBreakdown.images || 0)}`}
              />
              <div
                style={{ width: `${Math.max(3, audioPct)}%` }}
                className="bg-[#f59e0b] h-full"
                title={`Sprachnachrichten: ${formatBytes(stats?.mediaBreakdown.audio || 0)}`}
              />
              <div
                style={{ width: `${Math.max(3, docsPct)}%` }}
                className="bg-[#3b82f6] h-full"
                title={`Dokumente: ${formatBytes(stats?.mediaBreakdown.documents || 0)}`}
              />
              <div
                style={{ width: `${Math.max(2, msgPct)}%` }}
                className="bg-[#8b5cf6] h-full"
                title={`Nachrichtentexte: ${formatBytes(stats?.mediaBreakdown.messages || 0)}`}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-[#54656f] dark:text-[#8696a0]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />
                <span>Fotos ({formatBytes(stats?.mediaBreakdown.images || 0)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span>Audio ({formatBytes(stats?.mediaBreakdown.audio || 0)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                <span>Docs ({formatBytes(stats?.mediaBreakdown.documents || 0)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
                <span>Texte ({formatBytes(stats?.mediaBreakdown.messages || 0)})</span>
              </div>
            </div>
          </div>

          {/* Chats breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#54656f] dark:text-[#8696a0]">
                Speichernutzung nach Chats
              </h3>
              <button
                type="button"
                onClick={fetchStats}
                className="text-xs text-[#00a884] flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Aktualisieren
              </button>
            </div>

            <div className="border border-[#e9edef] dark:border-[#2a3942] rounded-xl divide-y divide-[#e9edef] dark:divide-[#2a3942] overflow-hidden">
              {loading ? (
                <div className="p-6 text-center text-xs text-[#8696a0]">Lade Speicherstatistiken...</div>
              ) : stats?.chatBreakdown.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8696a0]">Keine Chats vorhanden.</div>
              ) : (
                stats?.chatBreakdown.map((chat) => (
                  <div
                    key={chat.chatId}
                    className="p-3 flex items-center justify-between hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <WhatsAppAvatar avatarUrl={chat.chatAvatar} size="md" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#111b21] dark:text-[#e9edef] truncate">
                          {chat.chatName}
                        </p>
                        <p className="text-[11px] text-[#54656f] dark:text-[#8696a0]">
                          {chat.messagesCount} Nachrichten • {chat.mediaCount} Medien
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-[#111b21] dark:text-[#e9edef]">
                        {formatBytes(chat.totalBytes)}
                      </span>
                      {chat.mediaCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setClearingConfirm({ chatId: chat.chatId, chatName: chat.chatName })}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Medien freigeben"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Dialog for Clearing Media */}
        {clearingConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-[#111b21] rounded-xl p-5 max-w-sm w-full border border-[#e9edef] dark:border-[#2a3942] shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="text-sm font-bold text-[#111b21] dark:text-[#e9edef]">
                  Medien freigeben?
                </h4>
              </div>
              <p className="text-xs text-[#54656f] dark:text-[#8696a0] leading-relaxed">
                Möchtest du alle Bilder, Videos und Audios aus dem Chat <strong>{clearingConfirm.chatName}</strong> löschen, um Speicherplatz freizugeben? Nachrichtentexte bleiben erhalten.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClearingConfirm(null)}
                  className="px-3.5 py-1.5 text-xs text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => handleClearMedia(clearingConfirm.chatId)}
                  className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
                >
                  Medien löschen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-4 border-t border-[#e9edef] dark:border-[#2a3942] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-[#008069] hover:bg-[#00a884] text-white rounded-lg transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
