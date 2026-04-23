'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { getPoll, updatePoll } from '@/lib/db';
import { findMyPoll } from '@/lib/mypolls';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/context/LanguageContext';
import { safeBack } from '@/lib/navigation';

// ------------------------------------------------------------
//  RATINGS — Edit page
//  Ojo: ratings tiene estructura de items distinta (label +
//  locationUrl + comment), y el CreatePollForm NO lo soporta.
//  Por ahora, este edit sólo permite ajustar título / descripción
//  / imagen de portada del poll. Los items se editan borrando y
//  creando un rating nuevo (o vía el modal "Editar título" del
//  menú ⋮ si es sólo el título).
// ------------------------------------------------------------

export default function EditRatingPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();

  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPoll = async () => {
      const data = await getPoll(token);
      if (!data) {
        setError('not_found');
        setLoading(false);
        return;
      }

      const my = findMyPoll(token);
      if (my?.role !== 'creator') {
        setError('not_creator');
        setLoading(false);
        return;
      }

      if (new Date(data.expiresAt) <= new Date()) {
        setError('expired');
        setLoading(false);
        return;
      }

      setTitle(data.title || '');
      setDescription(data.description || '');
      setCoverImage(data.coverImage || '');
      setLoading(false);
    };

    loadPoll();
  }, [token]);

  const handleCoverUpload = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('create.imageTooBig') || 'Imagen demasiado grande (máx 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverImage((e.target?.result as string) || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('ratings.titleRequired') || 'El título es obligatorio');
      return;
    }
    setSaving(true);
    const ok = await updatePoll(token, {
      title: title.trim(),
      description,
      coverImage,
    });
    setSaving(false);
    if (ok) {
      toast.success(t('poll.updated'));
      router.push(`/ratings/${token}`);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
        </div>
      </PageLayout>
    );
  }

  if (error === 'not_found') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('ratings.notFound')}</h2>
            <p className="text-[var(--text-muted)] mb-6">{t('ratings.notFoundDesc')}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error === 'not_creator') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('poll.notCreator')}</h2>
            <p className="text-[var(--text-muted)] mb-6">{t('poll.notCreatorDesc')}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error === 'expired') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('poll.expired')}</h2>
            <p className="text-[var(--text-muted)] mb-6">{t('poll.expiredEditDesc')}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button
          onClick={() => safeBack(router, `/ratings/${token}`)}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">{t('poll.editRating')}</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {t('poll.editRatingHint')}
        </p>

        <div className="space-y-5">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
              {t('create.titleLabel') || 'Título'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder={t('poll.titlePlaceholder')}
              maxLength={100}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
              {t('create.descriptionLabel') || 'Descripción'}
              <span className="text-[var(--text-muted)] font-normal"> ({t('common.optional') || 'opcional'})</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              placeholder={t('create.descriptionPlaceholder') || 'Contexto para los participantes…'}
              maxLength={500}
            />
          </div>

          {/* Cover image */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
              {t('create.coverImageLabel') || 'Imagen de portada'}
              <span className="text-[var(--text-muted)] font-normal"> ({t('common.optional') || 'opcional'})</span>
            </label>
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt="" className="w-full h-40 sm:h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                  aria-label={t('common.delete') || 'Eliminar'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl py-8 flex flex-col items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">{t('create.uploadImage') || 'Subir imagen'}</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverUpload(file);
                e.target.value = '';
              }}
            />
          </div>

          {/* Items info */}
          <div className="rounded-xl p-3 bg-[var(--badge-neutral-bg)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
            {t('poll.editRatingItemsNote')}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => safeBack(router, `/ratings/${token}`)}
              className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors font-medium"
            >
              {t('poll.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? '…' : t('poll.save')}
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
