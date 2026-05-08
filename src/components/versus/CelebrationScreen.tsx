'use client';

import { Player } from '@/types/versus';
import { motion } from 'framer-motion';
import { Share2, Check, X } from 'lucide-react';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';

interface CelebrationScreenProps {
  champion: Player;
  tournamentTitle: string;
  /**
   * Optional fallback handler from the parent page. Used if html2canvas
   * fails on the celebration card. Kept for backwards compatibility — the
   * parent page also captures the bracket as image.
   */
  onShareResult?: () => void;
  /**
   * Cierra el modal. Sin esto, el modal queda fixed sobre la página y no
   * hay forma de volver a ver el bracket.
   */
  onClose?: () => void;
}

export const CelebrationScreen = ({ champion, tournamentTitle, onShareResult, onClose }: CelebrationScreenProps) => {
  const [shared, setShared] = useState(false);
  const [busy, setBusy] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // ----------------------------------------------------------------
  //  Share — captures the winner card (trophy + name + title) as
  //  PNG image, copies to clipboard, and falls back to download.
  //  Mirrors the SpinWheel share pattern.
  // ----------------------------------------------------------------
  const handleShareImage = async () => {
    if (!captureRef.current || busy) return;

    setBusy(true);

    const fallbackText = `${champion.name} ${t('versus.wonTournament')} '${tournamentTitle}' ${t('versus.inPickly')} 🏆`;

    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setBusy(false);
          return;
        }

        // Try clipboard first (desktop + modern browsers)
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setShared(true);
          toast.success(t('versus.copied'));
          setTimeout(() => setShared(false), 2000);
        } catch (err) {
          console.error('Failed to copy image to clipboard:', err);
          // Fallback: download the image
          try {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `pickly-champion-${champion.name}.png`;
            link.href = url;
            link.click();
            setShared(true);
            toast.success(t('versus.downloaded'));
            setTimeout(() => setShared(false), 2000);
          } catch (downloadErr) {
            console.error('Failed to download image:', downloadErr);
            // Final fallback: native share or text clipboard
            await fallbackShareText(fallbackText);
          }
        } finally {
          setBusy(false);
        }
      });
    } catch (err) {
      console.error('Failed to capture celebration card:', err);

      // If parent provided a fallback (e.g. capture the full bracket), try that.
      if (onShareResult) {
        try {
          onShareResult();
          setBusy(false);
          return;
        } catch (parentErr) {
          console.error('Parent share fallback failed:', parentErr);
        }
      }

      await fallbackShareText(fallbackText);
      setBusy(false);
    }
  };

  const fallbackShareText = async (text: string) => {
    // Try native share (mobile)
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${champion.name} 🏆`,
          text,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        });
        return;
      }
    } catch {
      // user cancelled — fall through to clipboard text
    }

    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      toast.success(t('versus.copied'));
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error('Share failed:', err);
      toast.error(t('versus.error'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] px-8 pt-12 pb-8 max-w-md w-full text-center"
      >
        {/* Close button — pegado al ángulo superior derecho, separado de la
            card dorada con espacio extra de pt-12 en el modal. */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={16} />
          </button>
        )}
        {/* Capture target: trophy + champion name + tournament title.
            We use a solid background color here so html2canvas produces a
            clean image regardless of the user's theme. */}
        <div
          ref={captureRef}
          className="rounded-xl px-6 pt-8 pb-6 mb-6"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)',
          }}
        >
          {/* Trophy. leading-none + line-height inline para que html2canvas
              no agregue descender invisible que pegue el cup al "CHAMPION". */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-7xl mb-6 leading-none"
            style={{ lineHeight: 1 }}
          >
            🏆
          </motion.div>

          {/* Champion */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div
              className="uppercase text-xs font-bold tracking-widest mb-3"
              style={{ color: '#78350f' }}
            >
              {t('versus.championBadge')}
            </div>
            <h2
              className="text-3xl font-bold mb-3 break-words"
              style={{ color: '#451a03' }}
            >
              {champion.name}
            </h2>
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-medium break-words"
            style={{ color: '#78350f' }}
          >
            {t('versus.isChampionOf')} {tournamentTitle}
          </motion.p>

          <div
            className="mt-4 text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#92400e' }}
          >
            Pickly · letspickly.com
          </div>
        </div>

        {/* Share Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={handleShareImage}
          disabled={busy}
          className="w-full px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {shared ? <Check size={18} /> : <Share2 size={18} />}
          {busy ? t('versus.generating') : shared ? t('versus.copied') : t('versus.shareResult')}
        </motion.button>

        {/* Sparkles only in bottom-right corner */}
        <div className="absolute -bottom-4 -right-4 text-4xl animate-bounce">✨</div>
      </motion.div>
    </div>
  );
};
