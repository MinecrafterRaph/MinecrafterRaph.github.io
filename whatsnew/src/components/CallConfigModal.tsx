import React, { useState } from 'react';
import { Cloud, Shield, Key, Globe, Server, Check, X, PhoneCall, Sparkles } from 'lucide-react';
import { CallConfig, CallProvider } from '../types';

interface CallConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: CallConfig;
  onSaveConfig: (config: CallConfig) => void;
  onStartCallAfterConfig?: () => void;
}

export const CallConfigModal: React.FC<CallConfigModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  onStartCallAfterConfig,
}) => {
  const [provider, setProvider] = useState<CallProvider>(currentConfig?.provider || 'demo');
  const [serverUrl, setServerUrl] = useState(currentConfig?.serverUrl || '');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [useDemoFallback, setUseDemoFallback] = useState(currentConfig?.provider === 'demo');

  if (!isOpen) return null;

  const handleSave = () => {
    const isConfigured = provider === 'demo' ? true : !!(serverUrl.trim() || apiKey.trim());
    const newConfig: CallConfig = {
      provider,
      serverUrl: serverUrl.trim(),
      apiKey: apiKey.trim(),
      isConfigured,
    };
    onSaveConfig(newConfig);
    if (onStartCallAfterConfig && isConfigured) {
      onStartCallAfterConfig();
    }
    onClose();
  };

  const handleUseDemo = () => {
    setProvider('demo');
    setServerUrl('wss://webrtc-cloud.internal.demo/signaling');
    setApiKey('demo_live_token_7782');
    setUseDemoFallback(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#e9edef] dark:border-[#222e35] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#008069] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-tight">Anrufe & Cloud-API anpassen</h2>
              <p className="text-xs text-white/80">Eigene Cloud-Infrastruktur oder API konfigurieren</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#111b21] dark:text-[#e9edef]">
          {/* Info Banner */}
          <div className="bg-[#f0f2f5] dark:bg-[#202c33] rounded-xl p-3.5 flex gap-3 text-xs leading-relaxed border border-[#d1d7db]/60 dark:border-[#2a3942]">
            <Shield className="w-5 h-5 text-[#00a884] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Ende-zu-Ende verschlüsselte Web-Telefonie</p>
              <p className="text-[#54656f] dark:text-[#8696a0]">
                Für Video- & Sprachanrufe im Webbrowser kannst du deine eigene Cloud (WebRTC Signaling Server, Agora, LiveKit oder Custom API) einbinden.
              </p>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#54656f] dark:text-[#8696a0]">
              Cloud-Dienst / API-Typ
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setProvider('webrtc')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  provider === 'webrtc'
                    ? 'border-[#00a884] bg-[#00a884]/10 text-[#00a884] font-medium'
                    : 'border-[#e9edef] dark:border-[#2a3942] hover:bg-[#f0f2f5] dark:hover:bg-[#202c33]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Server className="w-4 h-4" />
                  <span className="font-semibold">WebRTC Signaling</span>
                </div>
                <span className="text-[11px] text-[#54656f] dark:text-[#8696a0]">Eigener Socket-Server</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('agora')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  provider === 'agora'
                    ? 'border-[#00a884] bg-[#00a884]/10 text-[#00a884] font-medium'
                    : 'border-[#e9edef] dark:border-[#2a3942] hover:bg-[#f0f2f5] dark:hover:bg-[#202c33]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Cloud className="w-4 h-4" />
                  <span className="font-semibold">Agora / LiveKit</span>
                </div>
                <span className="text-[11px] text-[#54656f] dark:text-[#8696a0]">RTC Cloud API</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('custom')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  provider === 'custom'
                    ? 'border-[#00a884] bg-[#00a884]/10 text-[#00a884] font-medium'
                    : 'border-[#e9edef] dark:border-[#2a3942] hover:bg-[#f0f2f5] dark:hover:bg-[#202c33]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span className="font-semibold">Custom Cloud API</span>
                </div>
                <span className="text-[11px] text-[#54656f] dark:text-[#8696a0]">Eigenes REST / WSS</span>
              </button>

              <button
                type="button"
                onClick={handleUseDemo}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  provider === 'demo'
                    ? 'border-[#00a884] bg-[#00a884]/10 text-[#00a884] font-medium'
                    : 'border-[#e9edef] dark:border-[#2a3942] hover:bg-[#f0f2f5] dark:hover:bg-[#202c33]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[#00a884]">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">Integrierter Test</span>
                </div>
                <span className="text-[11px] text-[#54656f] dark:text-[#8696a0]">Demo-Cloud (1-Klick)</span>
              </button>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#54656f] dark:text-[#8696a0] mb-1">
                Server URL / Signaling Endpoint:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder={
                    provider === 'webrtc'
                      ? 'wss://webrtc-signaling.my-domain.com'
                      : provider === 'agora'
                      ? 'https://api.livekit.cloud oder Agora App ID'
                      : 'https://meine-cloud-api.de/calls'
                  }
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-[#d1d7db] dark:border-[#2a3942] focus:outline-none focus:border-[#00a884] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#54656f] dark:text-[#8696a0] mb-1">
                API-Key / Auth-Token (Optional):
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_live_..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-[#d1d7db] dark:border-[#2a3942] focus:outline-none focus:border-[#00a884] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Quick Demo Helper */}
          {provider !== 'demo' && (
            <button
              type="button"
              onClick={handleUseDemo}
              className="text-xs text-[#00a884] hover:underline flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Keine eigene Cloud zur Hand? Integrierten Testmodus aktivieren
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-4 border-t border-[#e9edef] dark:border-[#2a3942] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-[#008069] hover:bg-[#00a884] text-white rounded-lg shadow transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Konfiguration speichern
          </button>
        </div>
      </div>
    </div>
  );
};
