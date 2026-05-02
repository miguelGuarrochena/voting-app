'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link2, X, Loader2 } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getMyPolls } from '@/lib/mypolls';
import { claimPolls, claimTournaments } from '@/lib/auth';

// ClaimBanner
// Shown when:
//   - There's a logged-in auth user
//   - localStorage has polls with role='creator' (created pre-login)
//   - The user hasn't already claimed or dismissed on this device/account
//
// On "Link":
//   - Calls claim_polls_rpc + claim_tournaments_rpc
//   - Toast with the total claimed
//   - Marks done so we don't show it again
//
// On "Not now":
//   - Marks dismissed per user-id (reappears if the account changes)

export function ClaimBanner() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  const [pollTokens, setPollTokens] = useState<string[]>([]);
  const [versusTokens, setVersusTokens] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setHidden(false);
      setPollTokens([]);
      setVersusTokens([]);
      return;
    }

    // Chequeamos las flags por user.id
    if (
      localStorage.getItem(`pickly_claim_done:${user.id}`) === '1' ||
      localStorage.getItem(`pickly_claim_dismissed:${user.id}`) === '1'
    ) {
      setHidden(true);
      return;
    }

    const all = getMyPolls();
    const creators = all.filter((p) => p.role === 'creator' && p.token);
    const polls = creators
      .filter((p) => p.type !== 'versus')
      .map((p) => p.token);
    const versus = creators
      .filter((p) => p.type === 'versus')
      .map((p) => p.token);

    setPollTokens(polls);
    setVersusTokens(versus);
  }, [user, loading]);

  const total = pollTokens.length + versusTokens.length;
  if (loading || !user || hidden || total === 0) return null;

  const handleClaim = async () => {
    if (busy) return;
    setBusy(true);

    const [pollsClaimed, versusClaimed] = await Promise.all([
      claimPolls(pollTokens),
      claimTournaments(versusTokens),
    ]);

    const claimed = pollsClaimed + versusClaimed;

    // Incluso si claimed === 0 (ya estaban reclamadas), marcamos done
    // para no repetir el banner.
    localStorage.setItem(`pickly_claim_done:${user.id}`, '1');

    if (claimed > 0) {
      const msg =
        claimed === 1
          ? t('auth.claimSuccessOne')
          : t('auth.claimSuccessMany').replace('{count}', String(claimed));
      toast.success(msg);
    }

    setBusy(false);
    setHidden(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(`pickly_claim_dismissed:${user.id}`, '1');
    setHidden(true);
  };

  const description =
    total === 1
      ? t('auth.claimDescOne')
      : t('auth.claimDescMany').replace('{count}', String(total));

  const claimLabel = t('auth.claimButton').replace('{count}', String(total));

  return (
    <div className="bg-[var(--primary-light)]/40 border border-[var(--primary-light)] rounded-2xl p-4 sm:p-5 mb-6 relative">
      <button
        onClick={handleDismiss}
        aria-label={t('auth.claimDismiss')}
        className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="mt-0.5 text-[var(--primary)]">
          <Link2 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-[var(--text)] mb-1">
            {t('auth.claimTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-3">
            {description}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClaim}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{claimLabel}</span>
            </button>
            <button
              onClick={handleDismiss}
              disabled={busy}
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] px-3 py-2 transition-colors"
            >
              {t('auth.claimDismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
