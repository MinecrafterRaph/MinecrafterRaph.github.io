import React from 'react';
import { X, Download } from 'lucide-react';

interface MediaLightboxProps {
  mediaUrl: string | null;
  caption?: string;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ mediaUrl, caption, onClose }) => {
  if (!mediaUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div
        className="absolute top-4 right-6 flex items-center gap-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            const a = document.createElement('a');
            a.href = mediaUrl;
            a.download = 'whatsapp-image.jpg';
            a.target = '_blank';
            a.click();
          }}
          className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title="Herunterladen"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title="Schließen"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Image Display */}
      <div
        className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={mediaUrl}
          alt="Preview"
          className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
          referrerPolicy="no-referrer"
        />
        {caption && (
          <p className="mt-3 text-white/90 text-sm font-medium bg-black/50 px-4 py-1.5 rounded-full">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
};
