import React, { useState } from 'react';
import {
  X,
  Laptop,
  Smartphone,
  Shield,
  QrCode,
  CheckCircle2,
  Trash2,
  Plus,
} from 'lucide-react';

interface DeviceSession {
  id: string;
  name: string;
  platform: 'Chrome' | 'Safari' | 'Firefox' | 'Windows' | 'macOS';
  os: string;
  location: string;
  lastActive: string;
  isCurrent?: boolean;
}

interface LinkedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinkedDevicesModal: React.FC<LinkedDevicesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [sessions, setSessions] = useState<DeviceSession[]>([
    {
      id: 'sess-1',
      name: 'Google Chrome',
      platform: 'Chrome',
      os: 'Windows 11',
      location: 'München, Deutschland',
      lastActive: 'Gerade aktiv',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      name: 'WhatsApp Web',
      platform: 'macOS',
      os: 'macOS Sonoma',
      location: 'Berlin, Deutschland',
      lastActive: 'Gestern um 18:42 Uhr',
    },
    {
      id: 'sess-3',
      name: 'Mozilla Firefox',
      platform: 'Firefox',
      os: 'Ubuntu Linux',
      location: 'Frankfurt, Deutschland',
      lastActive: 'Vor 3 Tagen',
    },
  ]);

  const [showQrCodeScanner, setShowQrCodeScanner] = useState(false);

  if (!isOpen) return null;

  const handleDisconnect = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#008069] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5" />
            <h2 className="text-base font-bold">Verknüpfte Geräte</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!showQrCodeScanner ? (
            <>
              {/* Illustration Hero */}
              <div className="text-center py-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#008069]/10 text-[#008069] flex items-center justify-center mb-3">
                  <Laptop className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-[#111b21]">
                  WhatsApp auf anderen Geräten nutzen
                </h3>
                <p className="text-xs text-[#667781] mt-1 max-w-xs mx-auto">
                  Nutze WhatsApp auf Web, Desktop und anderen Geräten, ohne dass dein Smartphone online bleiben muss.
                </p>

                <button
                  type="button"
                  onClick={() => setShowQrCodeScanner(true)}
                  className="mt-4 px-5 py-2.5 bg-[#008069] hover:bg-[#00a884] text-white font-semibold text-xs rounded-full shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Gerät verknüpfen
                </button>
              </div>

              {/* Connected Devices List */}
              <div>
                <div className="text-xs font-bold text-[#667781] uppercase tracking-wider mb-2">
                  Gerätestatus
                </div>

                <div className="border border-[#d1d7db] rounded-xl divide-y divide-[#f0f2f5] overflow-hidden bg-white">
                  {sessions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#667781]">
                      Keine anderen Geräte verknüpft
                    </div>
                  ) : (
                    sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3.5 flex items-center justify-between hover:bg-[#f9fafb] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#f0f2f5] text-[#54656f] flex items-center justify-center shrink-0">
                            <Laptop className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-[#111b21] truncate">
                                {sess.name} ({sess.os})
                              </span>
                              {sess.isCurrent && (
                                <span className="bg-[#d9fdd3] text-[#008069] text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Dieses Gerät
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#667781]">
                              {sess.lastActive} • {sess.location}
                            </div>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDisconnect(sess.id)}
                            title="Abmelden"
                            className="p-1.5 rounded-lg text-[#8696a0] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* End-to-End Encryption Security Note */}
              <div className="bg-[#f0f2f5] rounded-xl p-3.5 flex items-center gap-3 text-xs text-[#54656f]">
                <Shield className="w-5 h-5 text-[#008069] shrink-0" />
                <span>
                  Deine persönlichen Nachrichten, Anrufe und Medien sind auf all deinen verknüpften Geräten Ende-zu-Ende verschlüsselt.
                </span>
              </div>
            </>
          ) : (
            /* QR Code Linking Simulation */
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#008069]/10 text-[#008069] flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#111b21]">
                  Scanne den QR-Code auf deinem Computer
                </h3>
                <p className="text-xs text-[#667781] mt-1 max-w-sm mx-auto">
                  Öffne <span className="font-semibold text-[#008069]">web.whatsapp.com</span> auf deinem Zielgerät und halte die Kamera auf den Bildschirm.
                </p>
              </div>

              {/* Simulated QR Box */}
              <div className="w-48 h-48 mx-auto bg-white border-4 border-[#008069] rounded-2xl p-3 shadow-md flex items-center justify-center relative">
                <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-black/5 rounded-lg">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i * 7) % 3 === 0 || i === 0 || i === 5 || i === 30 || i === 35
                          ? 'bg-[#111b21]'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[#008069]">
                    <Laptop className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowQrCodeScanner(false)}
                  className="px-4 py-2 border border-[#d1d7db] text-xs font-semibold rounded-lg hover:bg-[#f0f2f5] text-[#54656f] transition-colors"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newSess: DeviceSession = {
                      id: `sess-${Date.now()}`,
                      name: 'Neues Gerät (Web)',
                      platform: 'Chrome',
                      os: 'macOS',
                      location: 'Hamburg, Deutschland',
                      lastActive: 'Gerade aktiv',
                    };
                    setSessions((p) => [...p, newSess]);
                    setShowQrCodeScanner(false);
                  }}
                  className="px-5 py-2 bg-[#008069] text-white text-xs font-semibold rounded-lg hover:bg-[#00a884] shadow-xs transition-colors"
                >
                  Verknüpfung simulieren
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
