import React, { useState, useEffect } from 'react';
import {
  Radio,
  Users,
  ShieldCheck,
  X,
  ArrowRight,
  Check,
  Share2,
  Copy,
  QrCode,
  Download,
} from 'lucide-react';
import QRCode from 'qrcode';
import { ChannelItem } from '../types';

interface ChannelInviteModalProps {
  channelId: string;
  isOpen: boolean;
  onClose: () => void;
  onJoinAndOpenChannel: (channelId: string) => void;
}

export const ChannelInviteModal: React.FC<ChannelInviteModalProps> = ({
  channelId,
  isOpen,
  onClose,
  onJoinAndOpenChannel,
}) => {
  const [channel, setChannel] = useState<ChannelItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  // Sharing, Copying & QR Code States
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);

  const inviteUrl = `https://minecrafterraph.github.io/whatsnew.html/channel/${channelId}`;

  // Generate QR Code whenever channelId changes
  useEffect(() => {
    if (!channelId) return;

    QRCode.toDataURL(inviteUrl, {
      width: 200,
      margin: 1.5,
      color: {
        dark: '#008069',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrCodeUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR Code:', err);
      });
  }, [inviteUrl, channelId]);

  useEffect(() => {
    if (!isOpen || !channelId) return;

    let isMounted = true;
    setIsLoading(true);

    async function loadChannel() {
      try {
        const res = await fetch(`/api/channels/${channelId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setChannel(data);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Channel fetch fallback to all channels:', err);
      }

      // Fallback: fetch all channels
      try {
        const allRes = await fetch('/api/channels');
        if (allRes.ok) {
          const channels: ChannelItem[] = await allRes.json();
          if (isMounted) {
            const found =
              channels.find((c) => c.id === channelId) ||
              channels.find((c) => c.id === 'whatsapp-official') ||
              channels[0];
            setChannel(found || null);
          }
        }
      } catch (e) {
        console.error('Failed to load channel for invite modal:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadChannel();

    return () => {
      isMounted = false;
    };
  }, [isOpen, channelId]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    try {
      navigator.clipboard?.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (e) {
      console.error('Copy link failed:', e);
    }
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard?.writeText(channelId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch (e) {
      console.error('Copy code failed:', e);
    }
  };

  const handleShareInviteLink = async () => {
    const channelTitle = channel?.name || 'WhatsNew Kanal';
    const shareData = {
      title: `${channelTitle} auf WhatsNew`,
      text: `Tritt dem Kanal "${channelTitle}" auf WhatsNew bei und verpasse keine Updates!`,
      url: inviteUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled share dialog
        console.warn('Web Share failed, fallback to copy:', err);
      }
    }

    // Fallback: Copy to clipboard
    handleCopyLink();
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  const handleJoin = () => {
    setHasJoined(true);
    setTimeout(() => {
      onJoinAndOpenChannel(channelId);
      onClose();
    }, 400);
  };

  return (
    <div
      id="channel-invite-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="channel-invite-card"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#d1d7db] flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#00a884] to-[#008069] px-6 py-4 sm:py-5 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white/20 text-white">
              Kanal-Einladung
            </span>
            <span className="text-[11px] text-emerald-100 font-mono truncate max-w-[200px] bg-black/10 px-2 py-0.5 rounded">
              Code: {channelId}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-200 animate-pulse" />
            <span>Kanal-Einladung & Teilen</span>
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Offizieller Einladungslink für WhatsNew ({inviteUrl})
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-[#667781]">
              <div className="w-8 h-8 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Kanal-Informationen werden geladen...</p>
            </div>
          ) : channel ? (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Channel Avatar & Info */}
              <div className="relative">
                <img
                  src={channel.avatar}
                  alt={channel.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-emerald-100"
                />
                {channel.verified && (
                  <span
                    title="Verifizierter Kanal"
                    className="absolute -bottom-1 -right-1 bg-[#00a884] text-white p-1 rounded-full shadow-sm ring-2 ring-white"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#111b21] flex items-center justify-center gap-1.5">
                  <span>{channel.name}</span>
                </h3>
                <div className="flex items-center justify-center gap-2 text-xs text-[#667781] mt-1">
                  <Users className="w-3.5 h-3.5 text-[#008069]" />
                  <span>{channel.followers || 'Offizieller Kanal'}</span>
                  {channel.category && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-[#008069]">{channel.category}</span>
                    </>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#54656f] leading-relaxed max-w-md bg-[#f0f2f5] p-3 rounded-xl border border-[#e9edef]">
                {channel.description || 'Aktuelle Neuigkeiten und Updates in diesem Kanal.'}
              </p>

              {/* Share & Invite Section */}
              <div className="w-full bg-[#f8f9fa] border border-[#d1d7db] rounded-xl p-4 text-left space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111b21] uppercase tracking-wide flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-[#008069]" />
                    <span>Einladungs-Details</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="text-[11px] font-semibold text-[#008069] hover:text-[#00a884] flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded-lg hover:bg-emerald-50"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQrCode ? 'QR-Code verbergen' : 'QR-Code anzeigen'}</span>
                  </button>
                </div>

                {/* 1. Invite Link with Copy Icon */}
                <div>
                  <label className="text-[11px] font-medium text-[#54656f] block mb-1">
                    Einladungs-Link:
                  </label>
                  <div className="flex items-center gap-1.5 bg-white border border-[#d1d7db] rounded-lg p-1.5 pr-2 focus-within:border-[#008069] transition-colors">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className="text-xs text-[#111b21] font-mono flex-1 bg-transparent border-none outline-hidden px-2 select-all truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      title="Link kopieren"
                      aria-label="Einladungs-Link kopieren"
                      className="p-1.5 bg-[#f0f2f5] hover:bg-[#e9edef] active:bg-[#008069]/10 text-[#008069] rounded-md transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[11px] font-semibold text-emerald-700">Kopiert!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#54656f]" />
                          <span className="text-[11px] font-medium text-[#54656f]">Kopieren</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Invite Code (Channel ID) with Copy Icon */}
                <div>
                  <label className="text-[11px] font-medium text-[#54656f] block mb-1">
                    Einladungs-Code (Kanal-ID):
                  </label>
                  <div className="flex items-center gap-1.5 bg-white border border-[#d1d7db] rounded-lg p-1.5 pr-2 focus-within:border-[#008069] transition-colors">
                    <div className="flex-1 px-2 font-mono text-xs font-semibold text-[#008069] truncate">
                      {channelId}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      title="Code kopieren"
                      aria-label="Kanal-Code kopieren"
                      className="p-1.5 bg-[#f0f2f5] hover:bg-[#e9edef] active:bg-[#008069]/10 text-[#008069] rounded-md transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[11px] font-semibold text-emerald-700">Kopiert!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#54656f]" />
                          <span className="text-[11px] font-medium text-[#54656f]">Code kopieren</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. QR Code Generator (Toggle / View) */}
                {showQrCode && (
                  <div className="bg-white border border-[#d1d7db] rounded-xl p-4 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs font-semibold text-[#111b21] mb-2 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#008069]" />
                      <span>Mit dem Smartphone scannen</span>
                    </p>

                    {qrCodeUrl ? (
                      <div className="relative p-2 bg-white rounded-xl shadow-xs border border-gray-200 mb-3">
                        <img
                          src={qrCodeUrl}
                          alt="Kanal QR-Code"
                          className="w-40 h-40 object-contain rounded"
                        />
                      </div>
                    ) : (
                      <div className="w-40 h-40 bg-gray-100 flex items-center justify-center text-xs text-gray-500 rounded">
                        QR-Code wird erstellt...
                      </div>
                    )}

                    <p className="text-[11px] text-[#667781] text-center max-w-xs mb-3">
                      Scanne diesen Code mit der Kamera, um direkt auf WhatsNew zum Kanal weitergeleitet zu werden.
                    </p>

                    {qrCodeUrl && (
                      <a
                        href={qrCodeUrl}
                        download={`whatsnew-channel-${channelId}-qr.png`}
                        className="text-xs font-medium text-[#008069] hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>QR-Code herunterladen</span>
                      </a>
                    )}
                  </div>
                )}

                {/* 4. 'Share Invite Link' Button (Web Share API) */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleShareInviteLink}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#008069] border border-emerald-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    {shareSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span className="text-emerald-800">Link geteilt / kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-[#008069]" />
                        <span>Share Invite Link (Web Share & Teilen)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#667781]">
              <p>Der angeforderte Kanal ({channelId}) konnte nicht gefunden werden.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-[#f0f2f5] border-t border-[#e9edef] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:text-[#111b21] hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            Schließen
          </button>
          <button
            type="button"
            onClick={handleJoin}
            disabled={isLoading || hasJoined}
            className="px-5 py-2.5 bg-[#008069] hover:bg-[#00a884] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all hover:shadow cursor-pointer disabled:opacity-50"
          >
            {hasJoined ? (
              <>
                <Check className="w-4 h-4" />
                <span>Beigetreten!</span>
              </>
            ) : (
              <>
                <span>Kanal beitreten</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
