import React, { useState, useEffect } from 'react';
import {
  Bell,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Info,
  X,
  Apple,
  Settings,
} from 'lucide-react';
import { NotificationGuideConfig } from '../types';

interface ExternalNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminEditor?: () => void;
  isAdmin?: boolean;
}

const DEFAULT_GUIDE: NotificationGuideConfig = {
  title: 'Externe Mitteilungen auf dem Smartphone aktivieren',
  subtitle:
    'So empfängst du WhatsNew-Nachrichten direkt in der Mitteilungsleiste deines Handys, auch wenn der Bildschirm gesperrt ist.',
  androidSteps: [
    {
      id: 'android-1',
      title: 'Benachrichtigungen im Browser gestatten',
      description:
        'Öffne WhatsNew auf deinem Smartphone (Chrome, Samsung Internet etc.). Tippe bei der Abfrage "Darf WhatsNew Benachrichtigungen senden?" auf "Zulassen" bzw. "Erlauben".',
      badge: 'Schritt 1',
    },
    {
      id: 'android-2',
      title: 'Als Web-App auf dem Startbildschirm installieren (Empfohlen)',
      description:
        'Tippe im Browser oben rechts auf die 3 Punkte (⋮) und wähle "Zum Startbildschirm hinzufügen" oder "App installieren". WhatsNew wird wie eine echte App abgelegt und empfängt Systemmitteilungen dauerhaft.',
      badge: 'Schritt 2',
    },
    {
      id: 'android-3',
      title: 'Akku-Optimierung prüfen',
      description:
        'Halte auf dem Startbildschirm das WhatsNew-Icon gedrückt ➔ App-Info (i) ➔ Akku ➔ "Nicht eingeschränkt" wählen, damit Nachrichten sofort im Sperrbildschirm aufpoppen.',
      badge: 'Schritt 3',
    },
  ],
  iosSteps: [
    {
      id: 'ios-1',
      title: 'WhatsNew in Apple Safari öffnen',
      description:
        'Apple erlaubt System-Mitteilungen auf dem Sperrbildschirm nur über den Safari-Browser. Öffne WhatsNew daher direkt in Apple Safari.',
      badge: 'Schritt 1',
    },
    {
      id: 'ios-2',
      title: 'Zum Home-Bildschirm hinzufügen (Apple Pflicht)',
      description:
        'Tippe unten in der Safari-Leiste auf das Teilen-Symbol (Viereck mit Pfeil nach oben ⎋). Scrolle etwas nach unten und wähle "Zum Home-Bildschirm" (+). Bestätige mit "Hinzufügen".',
      badge: 'Schritt 2 (Wichtig)',
    },
    {
      id: 'ios-3',
      title: 'Vom Home-Bildschirm starten & Mitteilungen erlauben',
      description:
        'Öffne WhatsNew jetzt über das neue Symbol direkt auf deinem Home-Bildschirm. Bestätige die Systemabfrage mit "Mitteilungen erlauben". Fertig!',
      badge: 'Schritt 3',
    },
  ],
  troubleshootingTips: [
    'Falls keine Mitteilung erscheint: Prüfe in den Smartphone-Einstellungen unter "Mitteilungen", ob Benachrichtigungen für den Browser gestattet sind.',
    'Auf deiner GitHub-Seite (whatsnew.html) muss das <iframe>-Attribut allow="... notifications" eingetragen sein.',
    'Stelle sicher, dass der "Nicht stören"- bzw. "Fokus"-Modus deines Handys deaktiviert ist.',
  ],
};

export const ExternalNotificationsModal: React.FC<ExternalNotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminEditor,
  isAdmin,
}) => {
  const [guide, setGuide] = useState<NotificationGuideConfig>(DEFAULT_GUIDE);
  const [activeOs, setActiveOs] = useState<'android' | 'ios'>('android');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Auto detect user OS
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) {
      setActiveOs('ios');
    } else {
      setActiveOs('android');
    }

    // Fetch dynamic guide configured by admin
    const fetchGuide = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/notification-guide');
        if (res.ok) {
          const data = await res.json();
          if (data && data.title) {
            setGuide(data);
          }
        }
      } catch (err) {
        console.error('Error loading notification guide:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuide();
  }, [isOpen]);

  if (!isOpen) return null;

  // Browser Permission Request Test
  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      setTestStatus('⚠️ Dein aktueller Browser unterstützt leider keine HTML5-Mitteilungen.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setTestStatus('✅ Benachrichtigungen wurden erfolgreich gestattet!');
        new Notification('WhatsNew Benachrichtigung', {
          body: 'Perfekt! Test-Nachricht erfolgreich auf deinem Gerät empfangen.',
          icon: '/favicon.ico',
        });
      } else if (perm === 'denied') {
        setTestStatus('❌ Benachrichtigungen wurden blockiert. Bitte in den Browser-Einstellungen entsperren.');
      } else {
        setTestStatus('ℹ️ Berechtigung wurde noch nicht erteilt.');
      }
    } catch {
      setTestStatus('⚠️ Mitteilungen konnten nicht angefordert werden (möglicherweise in einem iFrame blockiert).');
    }
  };

  const steps = activeOs === 'android' ? guide.androidSteps : guide.iosSteps;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#d1d7db]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#008069] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-2xs">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Externe Nachrichten
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                Mitteilungszentrale & Sperrbildschirm am Handy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isAdmin && onOpenAdminEditor && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminEditor();
                }}
                className="p-2 hover:bg-white/10 rounded-full text-white/90 hover:text-white transition-colors"
                title="Anleitung im Admin-Panel anpassen"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtitle & OS Switcher */}
        <div className="p-4 sm:p-5 pb-3 border-b border-[#e9edef] bg-[#f0f2f5]/50 shrink-0 space-y-3">
          <p className="text-xs sm:text-sm text-[#54656f] leading-relaxed">
            {guide.subtitle}
          </p>

          {/* OS Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#e9edef] rounded-xl">
            <button
              type="button"
              onClick={() => setActiveOs('android')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeOs === 'android'
                  ? 'bg-white text-[#008069] shadow-xs'
                  : 'text-[#54656f] hover:text-[#111b21]'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Android Smartphone</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveOs('ios')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeOs === 'ios'
                  ? 'bg-white text-[#008069] shadow-xs'
                  : 'text-[#54656f] hover:text-[#111b21]'
              }`}
            >
              <Apple className="w-4 h-4 text-neutral-800" />
              <span>Apple iPhone (iOS)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Step-by-Step List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm text-[#111b21]">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#667781]">
              Lade Schritt-für-Schritt-Anleitung...
            </div>
          ) : (
            <>
              {steps.map((step, idx) => (
                <div
                  key={step.id || idx}
                  className="p-4 rounded-xl border border-[#d1d7db] bg-white shadow-2xs hover:border-[#008069]/40 transition-colors space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#008069] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-[#111b21]">
                        {step.title}
                      </h4>
                    </div>
                    {step.badge && (
                      <span className="bg-emerald-100 text-[#008069] text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                        {step.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#54656f] leading-relaxed pl-8">
                    {step.description}
                  </p>

                  {/* Optional Image or GIF */}
                  {step.imageUrl && (
                    <div className="pl-8 pt-1">
                      <img
                        src={step.imageUrl}
                        alt={step.title}
                        className="rounded-lg max-h-48 w-full object-cover border border-[#e9edef]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Troubleshooting Notice Box */}
              {guide.troubleshootingTips && guide.troubleshootingTips.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Wichtige Hinweise & Fehlerbehebung</span>
                  </div>
                  <ul className="space-y-1.5 pl-5 list-disc text-[11px] text-amber-900/90 leading-relaxed">
                    {guide.troubleshootingTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f0f2f5] border-t border-[#e9edef] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-[#667781] text-center sm:text-left">
            {testStatus ? (
              <span className="font-medium text-[#111b21]">{testStatus}</span>
            ) : (
              <span>Teste sofort, ob dein Browser Mitteilungen zulässt:</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRequestPermission}
              className="flex-1 sm:flex-initial px-4 py-2 bg-white hover:bg-emerald-50 text-[#008069] border border-[#008069] rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Test-Erlaubnis anfordern</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2 bg-[#008069] hover:bg-[#00a884] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs text-center"
            >
              Verstanden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
