import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Eye, Send } from 'lucide-react';
import { ContactStory } from '../types';
import { WhatsAppAvatar } from './WhatsAppAvatar';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: ContactStory[];
  onAddStory: (mediaUrl: string, caption?: string) => void;
  onReplyToStory: (chatId: string, replyText: string) => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  stories,
  onAddStory,
  onReplyToStory,
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [replyInput, setReplyInput] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');

  // Story playback timer
  useEffect(() => {
    if (activeStoryIndex === null) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const storyDurationMs = 5000;
    const intervalMs = 50;
    const step = intervalMs / storyDurationMs;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          // Advance to next story or close
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeStoryIndex, stories.length]);

  if (!isOpen) return null;

  const currentStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStory || !replyInput.trim()) return;
    if (currentStory.chatId) {
      onReplyToStory(currentStory.chatId, `Antwort auf deinen Status: ${replyInput}`);
    }
    setReplyInput('');
    setActiveStoryIndex(null);
  };

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    onAddStory(newImageUrl.trim(), newCaption.trim() || undefined);
    setIsAddingNew(false);
    setNewImageUrl('');
    setNewCaption('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm select-none p-4">
      {/* Active Story Fullscreen Viewer */}
      {currentStory ? (
        <div className="relative w-full max-w-md h-[680px] bg-black rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          {/* Progress Bars */}
          <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
            {stories.map((s, idx) => (
              <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all"
                  style={{
                    width:
                      idx < activeStoryIndex!
                        ? '100%'
                        : idx === activeStoryIndex!
                        ? `${progress * 100}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 inset-x-4 z-30 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <WhatsAppAvatar
                name={currentStory.authorName}
                avatarUrl={currentStory.authorAvatar}
                size="sm"
                className="border border-white"
              />
              <div>
                <h4 className="font-semibold text-sm leading-tight">{currentStory.authorName}</h4>
                <p className="text-[11px] text-white/75">{currentStory.timestamp}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveStoryIndex(null)}
              className="p-1.5 text-white/80 hover:text-white rounded-full bg-black/20 hover:bg-black/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Content */}
          <div className="relative flex-1 bg-neutral-950 flex items-center justify-center overflow-hidden">
            <img
              src={currentStory.mediaUrl}
              alt="Story Content"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

            {/* Tap areas for next / prev */}
            <div
              className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
              onClick={() => {
                if (activeStoryIndex! > 0) setActiveStoryIndex(activeStoryIndex! - 1);
              }}
            />
            <div
              className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
              onClick={() => {
                if (activeStoryIndex! < stories.length - 1) {
                  setActiveStoryIndex(activeStoryIndex! + 1);
                } else {
                  setActiveStoryIndex(null);
                }
              }}
            />

            {/* Caption */}
            {currentStory.caption && (
              <div className="absolute bottom-16 inset-x-6 z-30 text-center">
                <span className="inline-block bg-black/60 backdrop-blur-xs text-white text-sm px-4 py-1.5 rounded-full">
                  {currentStory.caption}
                </span>
              </div>
            )}
          </div>

          {/* Quick Reply Bar */}
          <form
            onSubmit={handleSendReply}
            className="relative z-30 px-4 py-3 bg-black/80 flex items-center gap-2 border-t border-white/10"
          >
            <input
              type="text"
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              placeholder="Antworten..."
              className="flex-1 bg-white/15 text-white text-sm placeholder-white/60 px-4 py-2 rounded-full outline-none focus:bg-white/25"
            />
            <button
              type="submit"
              disabled={!replyInput.trim()}
              className="p-2 bg-[#00a884] text-white rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#008069] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* Stories Overview List */
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[560px] border border-[#e9edef]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#e9edef] bg-[#f0f2f5] flex items-center justify-between">
            <h3 className="font-semibold text-lg text-[#111b21]">Status</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#54656f] hover:text-[#111b21] rounded-full hover:bg-black/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* My Status Item */}
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f5f6f6] transition-colors">
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => setIsAddingNew(true)}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-[#e9edef] flex items-center justify-center font-bold text-[#54656f]">
                    Ich
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00a884] text-white rounded-full flex items-center justify-center border-2 border-white">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-[#111b21]">Mein Status</h4>
                  <p className="text-xs text-[#667781]">Tippe, um ein Bild hinzuzufügen</p>
                </div>
              </div>
            </div>

            {/* Add Story Form */}
            {isAddingNew && (
              <form onSubmit={handleCreateStory} className="p-3 bg-[#f0f2f5] rounded-xl space-y-3">
                <h5 className="text-xs font-semibold text-[#111b21]">Neuen Status erstellen</h5>
                <input
                  type="url"
                  required
                  placeholder="Bild-URL (z. B. Unsplash)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-transparent focus:border-[#00a884] outline-none"
                />
                <input
                  type="text"
                  placeholder="Bildunterschrift (optional)"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-transparent focus:border-[#00a884] outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1 text-xs text-[#54656f] hover:bg-black/5 rounded"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold bg-[#00a884] text-white rounded hover:bg-[#008069]"
                  >
                    Posten
                  </button>
                </div>
              </form>
            )}

            {/* Contact Status Section */}
            <div className="pt-2">
              <h5 className="text-xs font-semibold text-[#667781] uppercase tracking-wide px-2 mb-2">
                Aktuelle Meldungen
              </h5>
              <div className="space-y-1">
                {stories.map((story, idx) => (
                  <div
                    key={story.id}
                    onClick={() => setActiveStoryIndex(idx)}
                    className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-[#f5f6f6] cursor-pointer transition-colors"
                  >
                    {/* Ring around avatar */}
                    <div
                      className={`p-0.5 rounded-full border-2 ${
                        story.viewed ? 'border-[#8696a0]' : 'border-[#00a884]'
                      }`}
                    >
                      <WhatsAppAvatar
                        name={story.authorName}
                        avatarUrl={story.authorAvatar}
                        size="md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-[#111b21] truncate">
                        {story.authorName}
                      </h4>
                      <p className="text-xs text-[#667781]">{story.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
