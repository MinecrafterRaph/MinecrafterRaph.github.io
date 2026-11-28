import React, { useState, useEffect } from 'react';
import {
  MapPin,
  X,
  Navigation,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Compass,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { LocationData } from '../types';

interface LocationShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendLocation: (data: LocationData, text?: string) => void;
  dailyLimit?: number;
}

export const LocationShareModal: React.FC<LocationShareModalProps> = ({
  isOpen,
  onClose,
  onSendLocation,
  dailyLimit = 3,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [locationTitle, setLocationTitle] = useState('Mein aktueller Standort');
  const [todayUsageCount, setTodayUsageCount] = useState<number>(0);

  const todayKey = `whatsnew_loc_shares_${new Date().toISOString().slice(0, 10)}`;

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      // Load today usage
      try {
        const stored = localStorage.getItem(todayKey);
        setTodayUsageCount(stored ? parseInt(stored, 10) : 0);
      } catch {
        setTodayUsageCount(0);
      }
      // Auto fetch GPS position
      handleGetPosition();
    }
  }, [isOpen, todayKey]);

  const handleGetPosition = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolokalisierung wird von deinem Browser leider nicht unterstützt.');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg(
            'Standortzugriff wurde verweigert. Bitte erlaube den Standortzugriff in deinen Browser-Einstellungen.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg('Standortinformationen sind derzeit nicht verfügbar.');
        } else if (err.code === err.TIMEOUT) {
          setErrorMsg('Zeitüberschreitung beim Ermitteln des Standorts.');
        } else {
          setErrorMsg('Standort konnte nicht ermittelt werden.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      }
    );
  };

  const remainingUses = Math.max(0, dailyLimit - todayUsageCount);
  const isLimitReached = dailyLimit > 0 && remainingUses <= 0;

  const handleSend = () => {
    if (!coords || isLimitReached) return;

    // Increment today's usage count
    const nextCount = todayUsageCount + 1;
    try {
      localStorage.setItem(todayKey, nextCount.toString());
    } catch {
      // ignore storage errors
    }
    setTodayUsageCount(nextCount);

    const mapUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    onSendLocation(
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: locationTitle.trim() || 'Aktueller Standort',
        accuracy: coords.accuracy,
        mapUrl,
      },
      locationTitle.trim() || 'Aktueller Standort'
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#d1d7db] animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with prominent WIP Badge */}
        <div className="bg-[#008069] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base leading-tight">Standort teilen</h3>
                <span className="bg-amber-400 text-amber-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full tracking-wide shadow-2xs">
                  WIP / Beta
                </span>
              </div>
              <p className="text-white/80 text-xs mt-0.5">Echten GPS-Standort versenden</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Rate Limit Info Box */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
              isLimitReached
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <span>Tägliches Kontingent:</span>
                <span className="font-bold underline">
                  {remainingUses} von {dailyLimit} Freigaben verfügbar
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-opacity-80">
                {isLimitReached
                  ? 'Du hast dein tägliches Limit für heute erreicht. Dieses Limit spart Integrations-Credits und kann im Admin-Menü angepasst werden.'
                  : 'Aus Sicherheits- & Credit-Gründen ist das Teilen auf max. 3 Mal täglich limitiert (im Admin-Menü konfigurierbar).'}
              </p>
            </div>
          </div>

          {/* GPS Coordinates Preview Card */}
          <div className="bg-[#f0f2f5] p-3.5 rounded-xl border border-[#e9edef] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#111b21]">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#008069]" />
                Echter GPS-Sensor
              </span>
              <button
                type="button"
                onClick={handleGetPosition}
                disabled={isLocating}
                className="text-[#008069] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                {isLocating ? 'Ermittle...' : 'Aktualisieren'}
              </button>
            </div>

            {isLocating ? (
              <div className="py-4 flex flex-col items-center justify-center text-xs text-[#54656f] gap-2">
                <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                <span>Ermittle genaue GPS-Koordinaten über Browser-Sensor...</span>
              </div>
            ) : errorMsg ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="flex-1">
                  <span>{errorMsg}</span>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Fallback coordinates for demo purposes if GPS permission blocked in iFrame
                        setCoords({
                          latitude: 52.520008,
                          longitude: 13.404954,
                          accuracy: 25,
                        });
                        setErrorMsg(null);
                      }}
                      className="text-amber-900 underline font-medium hover:text-amber-950"
                    >
                      Beispiel-Koordinaten verwenden (Berlin Mitte)
                    </button>
                  </div>
                </div>
              </div>
            ) : coords ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-[#e9edef]">
                  <div>
                    <span className="text-[10px] text-[#667781] block">Breitengrad (Lat)</span>
                    <span className="font-mono font-medium text-[#111b21]">
                      {coords.latitude.toFixed(6)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#667781] block">Längengrad (Lng)</span>
                    <span className="font-mono font-medium text-[#111b21]">
                      {coords.longitude.toFixed(6)}°
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#54656f] px-1">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Genauigkeit: ±{coords.accuracy || 15}m
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#008069] hover:underline flex items-center gap-1"
                  >
                    <span>Vorschau in Karten</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 text-xs text-[#667781]">
                Noch keine Koordinaten empfangen.
              </div>
            )}
          </div>

          {/* Location Title / Note Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#111b21]">
              Bezeichnung / Notiz
            </label>
            <input
              type="text"
              value={locationTitle}
              onChange={(e) => setLocationTitle(e.target.value)}
              placeholder="z. B. Mein aktueller Standort, Treffpunkt..."
              className="w-full text-xs px-3 py-2 bg-white border border-[#d1d7db] rounded-lg focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] text-[#111b21]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f0f2f5] border-t border-[#e9edef] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#54656f] hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#d1d7db]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={!coords || isLocating || isLimitReached}
            onClick={handleSend}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${
              !coords || isLocating || isLimitReached
                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                : 'bg-[#008069] hover:bg-[#00705c] active:scale-98 cursor-pointer'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Standort senden</span>
          </button>
        </div>
      </div>
    </div>
  );
};
