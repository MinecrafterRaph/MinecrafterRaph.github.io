import React, { useState, useEffect } from 'react';
import {
  Check,
  Plus,
  Bell,
  BellOff,
  Share2,
  ShieldCheck,
  Radio,
  ExternalLink,
  Edit3,
  Trash2,
  Send,
  X,
  Sparkles,
  Film,
  Key,
  Lock,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Link as LinkIcon,
  QrCode,
} from 'lucide-react';
import { User, ChannelPost, ChannelItem } from '../types';
import { getChannelInviteLink } from '../utils/inviteLinks';

interface ChannelsViewProps {
  currentUser: User | null;
  onOpenInviteModal?: (channelId: string) => void;
}

const DEFAULT_WHATSAPP_CHANNEL: ChannelItem = {
  id: 'whatsapp-official',
  name: 'WhatsApp',
  category: 'Offiziell',
  verified: true,
  avatar: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=120&auto=format&fit=crop&q=80',
  followers: '154 Mio. Abonnenten',
  description: 'Offizielle Neuigkeiten, exklusive Einblicke und neue Funktionen direkt vom WhatsApp-Team.',
  isFollowing: true,
  isMuted: false,
  posts: [
    {
      id: 'p1',
      time: 'Heute, 14:30',
      text: 'Wir stellen neue WhatsApp-Funktionen für Freunde bereit: Benutzerdefinierte Chat-Hintergründe, persönliche Spitznamen, Einmal-Ansicht für Nachrichten und @Erwähnungen in Gruppen.',
      imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=600&auto=format&fit=crop&q=80',
      link: { title: 'WhatsApp Blog', url: 'https://whatsapp.com' },
      reactions: [
        { emoji: '👍', count: 18420 },
        { emoji: '❤️', count: 24150 },
        { emoji: '🔥', count: 9840 },
      ],
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'p2',
      time: 'Gestern, 11:15',
      text: 'Alle Fake-Communitys und Fremdkanäle wurden entfernt. Dieser Kanal bleibt der einzige offizielle Update-Kanal und kann von Administratoren direkt gepflegt und erweitert werden.',
      reactions: [
        { emoji: '👍', count: 14200 },
        { emoji: '❤️', count: 19800 },
      ],
      createdAt: Date.now() - 86400000,
    },
  ],
};

const AI_VIDEO_PROMPT_SUGGESTIONS = [
  'Offizielles Feature-Update: Personalisierte Hintergründe & Spitznamen',
  'WhatsApp Sicherheits- & Ende-zu-Ende Verschlüsselungs-Upgrade',
  'Neue interaktive Community- & Gruppen-Funktionen',
  'Performance-Booster: Schnellere Ladezeiten & Video-Stream',
];

export const ChannelsView: React.FC<ChannelsViewProps> = ({ currentUser, onOpenInviteModal }) => {
  const [channel, setChannel] = useState<ChannelItem>(DEFAULT_WHATSAPP_CHANNEL);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<ChannelPost | null>(null);

  // Form states for regular creating/editing post
  const [postText, setPostText] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postVideoUrl, setPostVideoUrl] = useState('');
  const [postVideoDuration, setPostVideoDuration] = useState('');
  const [postLinkTitle, setPostLinkTitle] = useState('');
  const [postLinkUrl, setPostLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-App safe delete confirmation (iFrame compliant, replaces window.confirm)
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Copy channel link state
  const [channelLinkCopied, setChannelLinkCopied] = useState(false);

  const isAdmin = !!(
    currentUser?.isAdmin ||
    currentUser?.name.toLowerCase() === 'whatsapp'
  );

  const handleCopyChannelLink = () => {
    const inviteUrl = getChannelInviteLink(channel.id || 'whatsapp-official');
    navigator.clipboard?.writeText(inviteUrl);
    setChannelLinkCopied(true);
    setTimeout(() => setChannelLinkCopied(false), 2500);
  };

  const fetchChannelData = async () => {
    try {
      const res = await fetch('/api/channels');
      if (res.ok) {
        const data: ChannelItem[] = await res.json();
        if (data && data.length > 0) {
          const official = data.find((c) => c.id === 'whatsapp-official') || data[0];
          setChannel(official);
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden des Kanals:', err);
    }
  };

  useEffect(() => {
    fetchChannelData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPost(null);
    setPostText('');
    setPostImageUrl('');
    setPostVideoUrl('');
    setPostVideoDuration('');
    setPostLinkTitle('');
    setPostLinkUrl('');
    setIsCreatingPost(true);
  };

  const handleOpenEditModal = (post: ChannelPost) => {
    setEditingPost(post);
    setPostText(post.text);
    setPostImageUrl(post.imageUrl || '');
    setPostVideoUrl(post.videoUrl || '');
    setPostVideoDuration(post.videoDuration || '');
    setPostLinkTitle(post.link?.title || '');
    setPostLinkUrl(post.link?.url || '');
    setIsCreatingPost(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingPost) {
        const res = await fetch(`/api/channels/${channel.id}/posts/${editingPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: postText.trim(),
            imageUrl: postImageUrl.trim() || undefined,
            videoUrl: postVideoUrl.trim() || undefined,
            videoDuration: postVideoDuration.trim() || undefined,
            isVideo: !!postVideoUrl.trim(),
            linkTitle: postLinkTitle.trim() || undefined,
            linkUrl: postLinkUrl.trim() || undefined,
          }),
        });
        if (res.ok) {
          await fetchChannelData();
          setIsCreatingPost(false);
        }
      } else {
        const res = await fetch(`/api/channels/${channel.id}/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: postText.trim(),
            imageUrl: postImageUrl.trim() || undefined,
            videoUrl: postVideoUrl.trim() || undefined,
            videoDuration: postVideoDuration.trim() || undefined,
            isVideo: !!postVideoUrl.trim(),
            linkTitle: postLinkTitle.trim() || undefined,
            linkUrl: postLinkUrl.trim() || undefined,
          }),
        });
        if (res.ok) {
          await fetchChannelData();
          setIsCreatingPost(false);
        }
      }
    } catch (err) {
      console.error('Fehler beim Speichern des Beitrags:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe In-App Delete Handler
  const confirmDeletePost = async () => {
    if (!deleteCandidateId) return;
    try {
      const res = await fetch(`/api/channels/${channel.id}/posts/${deleteCandidateId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setChannel((prev) => ({
          ...prev,
          posts: prev.posts.filter((p) => p.id !== deleteCandidateId),
        }));
      }
    } catch (err) {
      console.error('Fehler beim Löschen des Beitrags:', err);
    } finally {
      setDeleteCandidateId(null);
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    setChannel((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        const exists = p.reactions.find((r) => r.emoji === emoji);
        if (exists) {
          return {
            ...p,
            reactions: p.reactions.map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.userReacted ? r.count - 1 : r.count + 1,
                    userReacted: !r.userReacted,
                  }
                : r
            ),
          };
        }
        return {
          ...p,
          reactions: [...p.reactions, { emoji, count: 1, userReacted: true }],
        };
      }),
    }));

    try {
      await fetch(`/api/channels/${channel.id}/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'guest',
          emoji,
        }),
      });
    } catch (err) {
      console.error('Fehler bei der Reaktion:', err);
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#efeae2]">
      {/* Left Directory / Overview Bar */}
      <div className="w-80 md:w-96 border-r border-[#d1d7db] flex flex-col h-full bg-white select-none shrink-0">
        <div className="p-4 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#111b21] flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#008069]" /> Aktuelles & Updates
            </h1>
            <p className="text-xs text-[#667781] mt-0.5">
              Offizieller WhatsApp Update-Kanal
            </p>
          </div>
        </div>

        {/* Channel entry in sidebar */}
        <div className="p-3 border-b border-[#f0f2f5] bg-[#f0f2f5] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={channel.avatar}
              alt={channel.name}
              className="w-12 h-12 rounded-full object-cover border border-[#d1d7db] shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[#111b21] truncate">
                  {channel.name}
                </span>
                <ShieldCheck className="w-4 h-4 text-[#00a884] shrink-0 fill-[#00a884]/20" />
              </div>
              <div className="text-[11px] text-[#667781] truncate">
                {channel.followers} • {channel.category}
              </div>
            </div>
          </div>

          <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#d9fdd3] text-[#008069] rounded-full">
            Aktiv
          </span>
        </div>

        <div className="p-4 text-xs text-[#54656f] leading-relaxed flex-1 overflow-y-auto space-y-4">
          <div>
            <p className="font-semibold text-[#111b21] mb-1">Über diesen Kanal:</p>
            <p>{channel.description}</p>
          </div>

          <div className="p-3 rounded-lg bg-[#f0f2f5] border border-[#e9edef] space-y-1.5">
            <p className="font-semibold text-[#111b21] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#008069]" /> Privatsphäre & Sicherheit
            </p>
            <p className="text-[11px] text-[#667781]">
              Deine Mitgliedschaft und Reaktionen sind für andere Teilnehmer unsichtbar. Deine Nummer bleibt stets geschützt.
            </p>
          </div>

          {/* Admin Tools Section */}
          {isAdmin ? (
            <div className="p-3.5 rounded-xl bg-[#d9fdd3]/40 border border-[#00a884]/30 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#008069] flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4" /> Admin-Verwaltung
                </p>
                <span className="text-[10px] bg-[#008069] text-white px-2 py-0.5 rounded-full font-medium">
                  Administrator
                </span>
              </div>
              <p className="text-[11px] text-[#54656f]">
                Offizielle Ankündigungen und Text-Updates für den Kanal veröffentlichen.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="w-full py-2 px-3 bg-[#008069] hover:bg-[#00a884] text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" /> Update verfassen
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#f0f2f5] border border-[#d1d7db] space-y-1.5">
              <p className="font-medium text-xs text-[#111b21] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#008069]" /> WhatsApp-Kanal
              </p>
              <p className="text-[11px] text-[#667781]">
                Nur verifizierte WhatsApp-Administratoren können Beiträge in diesem Kanal veröffentlichen.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Feed */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="bg-white px-5 py-3 border-b border-[#d1d7db] flex items-center justify-between z-10 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={channel.avatar}
              alt={channel.name}
              className="w-11 h-11 rounded-full object-cover border border-[#d1d7db]"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-[#111b21] truncate">
                  {channel.name}
                </h2>
                <ShieldCheck className="w-4 h-4 text-[#00a884] fill-[#00a884]/20" />
              </div>
              <p className="text-xs text-[#667781]">
                {channel.followers} • Offizieller WhatsApp Kanal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#008069] hover:bg-[#00a884] text-white shadow-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Update posten
              </button>
            )}

            {onOpenInviteModal && (
              <button
                type="button"
                onClick={() => onOpenInviteModal(channel.id || 'whatsapp-official')}
                title="Einladungs-Details, Web Share & QR-Code öffnen"
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#008069] border border-emerald-300 transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Teilen & QR-Code</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyChannelLink}
              title="Einladungslink zum Kanal kopieren"
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                channelLinkCopied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white hover:bg-[#f0f2f5] text-[#54656f] border-[#d1d7db]'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{channelLinkCopied ? 'Kanal-Link kopiert!' : 'Kanal-Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isFollowing
                  ? 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]'
                  : 'bg-[#008069] hover:bg-[#00a884] text-white shadow-xs'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Abonniert
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Abonnieren
                </>
              )}
            </button>

            {isFollowing && (
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Stummschaltung aufheben' : 'Stummschalten'}
                className="p-2 rounded-full hover:bg-[#f0f2f5] text-[#54656f] transition-colors"
              >
                {isMuted ? (
                  <BellOff className="w-4 h-4 text-rose-500" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
              }}
              title="Kanal teilen"
              className="p-2 rounded-full hover:bg-[#f0f2f5] text-[#54656f] transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Feed Posts */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-3xl mx-auto w-full">
          {/* Privacy info banner */}
          <div className="bg-white/90 backdrop-blur-xs border border-[#d1d7db] rounded-lg p-3 text-center text-xs text-[#54656f] shadow-2xs">
            <span className="font-semibold text-[#111b21]">Offizieller Kanal: </span>
            Hier erhältst du Neuigkeiten, Sicherheitshinweise und Funktions-Updates direkt von WhatsApp.
          </div>

          {channel.posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl shadow-xs border border-[#d1d7db] overflow-hidden group/post relative"
            >
              {/* Media: Video or Image */}
              {post.videoUrl ? (
                <div className="w-full relative bg-black aspect-video overflow-hidden">
                  <video
                    src={post.videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    poster={post.imageUrl}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/75 text-white text-[11px] font-mono flex items-center gap-1.5 backdrop-blur-xs pointer-events-none shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span className="text-[#00a884] font-semibold">KI-Video</span>
                    {post.videoDuration && <span>• {post.videoDuration}</span>}
                  </div>
                </div>
              ) : post.imageUrl ? (
                <div className="w-full max-h-96 overflow-hidden bg-black/5">
                  <img
                    src={post.imageUrl}
                    alt="Update-Bild"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : null}

              <div className="p-4">
                {/* Admin controls per post */}
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-[#e9edef] shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(post)}
                      title="Beitrag bearbeiten"
                      className="p-1 rounded text-[#54656f] hover:text-[#008069] hover:bg-[#f0f2f5] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCandidateId(post.id)}
                      title="Beitrag löschen"
                      className="p-1 rounded text-[#54656f] hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <p className="text-sm text-[#111b21] leading-relaxed whitespace-pre-wrap">
                  {post.text}
                </p>

                {post.link && (
                  <a
                    href={post.link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-[#f0f2f5] hover:bg-[#e9edef] text-xs font-medium text-[#008069] transition-colors group"
                  >
                    <span>{post.link.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}

                <div className="mt-3 pt-3 border-t border-[#f0f2f5] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#667781]">{post.time}</span>

                  {/* Reaction Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.reactions.map((reaction) => (
                      <button
                        key={reaction.emoji}
                        type="button"
                        onClick={() => handleReact(post.id, reaction.emoji)}
                        className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                          reaction.userReacted
                            ? 'bg-[#d9fdd3] text-[#008069] border border-[#008069]/30 shadow-2xs font-semibold'
                            : 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]'
                        }`}
                      >
                        <span>{reaction.emoji}</span>
                        <span className="text-[11px]">
                          {reaction.count > 1000
                            ? `${(reaction.count / 1000).toFixed(1)}k`
                            : reaction.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Regular Update Post Create / Edit Modal                                   */}
      {/* ========================================================================= */}
      {isCreatingPost && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#d1d7db]">
            <div className="px-5 py-4 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center justify-between">
              <h3 className="font-bold text-[#111b21] text-base flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#008069]" />
                {editingPost ? 'Update-Beitrag bearbeiten' : 'Neues offizielles Update verfassen'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingPost(false)}
                className="p-1 rounded-full text-[#54656f] hover:bg-[#e9edef] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#54656f] mb-1">
                  Textinhalt der Ankündigung *
                </label>
                <textarea
                  rows={4}
                  required
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Beschreibe die neue Funktion oder Mitteilung..."
                  className="w-full text-sm p-3 rounded-lg border border-[#d1d7db] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none text-[#111b21]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#54656f] mb-1">
                  Bild-URL (optional)
                </label>
                <input
                  type="url"
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-sm p-2.5 rounded-lg border border-[#d1d7db] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none text-[#111b21]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#54656f] mb-1">
                  Video-URL (optional, falls ein Video eingebunden werden soll)
                </label>
                <input
                  type="url"
                  value={postVideoUrl}
                  onChange={(e) => setPostVideoUrl(e.target.value)}
                  placeholder="https://commondatastorage.googleapis.com/... oder .mp4"
                  className="w-full text-sm p-2.5 rounded-lg border border-[#d1d7db] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none text-[#111b21]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#54656f] mb-1">
                    Link-Titel (optional)
                  </label>
                  <input
                    type="text"
                    value={postLinkTitle}
                    onChange={(e) => setPostLinkTitle(e.target.value)}
                    placeholder="z. B. WhatsApp Blog"
                    className="w-full text-sm p-2.5 rounded-lg border border-[#d1d7db] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none text-[#111b21]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#54656f] mb-1">
                    Link-URL (optional)
                  </label>
                  <input
                    type="url"
                    value={postLinkUrl}
                    onChange={(e) => setPostLinkUrl(e.target.value)}
                    placeholder="https://whatsapp.com/..."
                    className="w-full text-sm p-2.5 rounded-lg border border-[#d1d7db] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none text-[#111b21]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0f2f5]">
                <button
                  type="button"
                  onClick={() => setIsCreatingPost(false)}
                  className="px-4 py-2 text-sm text-[#54656f] hover:bg-[#f0f2f5] rounded-lg transition-colors font-medium"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !postText.trim()}
                  className="px-5 py-2 text-sm bg-[#008069] hover:bg-[#00a884] disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Wird gespeichert...' : editingPost ? 'Änderungen speichern' : 'Veröffentlichen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* In-App Delete Confirmation Modal (iFrame safe, replaces window.confirm)    */}
      {/* ========================================================================= */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-[#d1d7db] space-y-3">
            <h3 className="font-bold text-[#111b21] text-base">Kanalbeitrag löschen?</h3>
            <p className="text-xs text-[#54656f]">
              Möchtest du diesen offiziellen Kanalbeitrag wirklich unwiderruflich aus dem Feed entfernen?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="px-3.5 py-1.5 text-xs text-[#54656f] hover:bg-[#f0f2f5] rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmDeletePost}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
