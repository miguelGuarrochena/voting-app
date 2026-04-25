'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, Trash2, ArrowLeft, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import toast from 'react-hot-toast';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';
import { createTournament } from '@/lib/db';
import { addMyPoll } from '@/lib/mypolls';
import { safeBack } from '@/lib/navigation';
import { generateBracketMatches, generateLeagueMatches } from '@/lib/tournament';
import { Player, TournamentMode } from '@/types/versus';
import { FEATURES } from '@/lib/features';
import { VersusComingSoon } from '@/components/versus/ComingSoon';
import { AnonCreateModal } from '@/components/auth/AnonCreateModal';
import { useFormValidation } from '@/hooks/useFormValidation';

type PlayerForm = {
  id: string;
  name: string;
};

type BracketSize = 2 | 4 | 8 | 16;

export default function CreateVersusPage() {
  if (!FEATURES.versus) return <VersusComingSoon />;
  return <CreateVersusPageInner />;
}

function CreateVersusPageInner() {
  const router = useRouter();
  const { username } = useUsername();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<TournamentMode>('bracket');
  // El default es bracket de 8 → arrancamos con 8 inputs vacíos. Si el user
  // cambia a otro tamaño o a liga, handleBracketSizeChange/handleModeChange
  // ajustan la lista. Antes arrancábamos con 2 inputs y quedaba inconsistente
  // con el default seleccionado.
  const [players, setPlayers] = useState<PlayerForm[]>(() =>
    Array.from({ length: 8 }, () => ({ id: crypto.randomUUID(), name: '' }))
  );
  const [selectedDuration, setSelectedDuration] = useState('3');
  const [bracketSize, setBracketSize] = useState<BracketSize>(8);
  const [hasScore, setHasScore] = useState(true);
  // matchupMode: 'auto' = Pickly random, 'manual' = orden de la lista
  const [matchupMode, setMatchupMode] = useState<'auto' | 'manual'>('auto');
  const [homeAndAway, setHomeAndAway] = useState(false);

  // Drag-drop state (desktop): índice del item agarrado
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Validation rules
  const validationRules = {
    title: {
      required: true,
      minLength: 3,
      maxLength: 100,
    },
  };

  const { errors, validateField, clearErrors, registerField } = useFormValidation(validationRules, {
    showToast: true,
    toastMessage: t('versus.completeRequiredFields'),
    scrollToFirstError: true,
    t,
  });

  // Duration options (days). Cap a 7 días: el plan free de Supabase
  // tiene 500MB y los torneos no son chiquitos (matches JSON puede crecer).
  // Si más adelante migramos a un plan pago, descomentamos 14 días.
  const durationOptions = [
    { value: '1', label: t('versus.1day'), days: 1 },
    { value: '3', label: t('versus.3days'), days: 3 },
    { value: '7', label: t('versus.7days'), days: 7 },
  ];

  // Bracket size options with preview icons
  const bracketSizeOptions: { value: BracketSize; label: string; icon: string }[] = [
    { value: 2, label: `2 ${t('versus.playersLabel').toLowerCase()}`, icon: '🥊' },
    { value: 4, label: `4 ${t('versus.playersLabel').toLowerCase()}`, icon: '⚔️' },
    { value: 8, label: `8 ${t('versus.playersLabel').toLowerCase()}`, icon: '🏆' },
    { value: 16, label: `16 ${t('versus.playersLabel').toLowerCase()}`, icon: '👑' },
  ];

  const addPlayer = () => {
    setPlayers([...players, { id: crypto.randomUUID(), name: '' }]);
  };

  const removePlayer = (id: string) => {
    if (players.length <= 2) return;
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayer = (id: string, name: string) => {
    setPlayers(players.map(player => (player.id === id ? { ...player, name } : player)));
  };

  /**
   * Reordena players moviendo el item en `from` a la posición `to`.
   * Si las posiciones son iguales o inválidas, no hace nada.
   */
  const reorderPlayers = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setPlayers((current) => {
      if (from >= current.length || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  // ----- Drag-drop handlers (desktop) -----
  // Usamos HTML5 drag-and-drop nativo para no agregar dependencias.
  // dragIndexRef guarda el índice de origen entre eventos (los datos
  // del drag los maneja el browser; el ref evita serialización innecesaria).
  const onDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Necesario en Firefox para que el drag arranque
    try { e.dataTransfer.setData('text/plain', String(index)); } catch {}
  };
  const onDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };
  const onDragLeave = () => setDragOverIndex(null);
  const onDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    setDragOverIndex(null);
    dragIndexRef.current = null;
    if (from === null) return;
    reorderPlayers(from, index);
  };
  const onDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  /**
   * Cuando el user elige un tamaño de bracket, ajustamos la lista de inputs
   * para tener exactamente N entradas. Conservamos los nombres ya cargados.
   */
  const handleBracketSizeChange = (size: BracketSize) => {
    setBracketSize(size);
    setPlayers((current) => {
      if (current.length === size) return current;
      if (current.length < size) {
        // Agregar inputs vacíos hasta llegar a size
        const toAdd = size - current.length;
        const extras = Array.from({ length: toAdd }, () => ({
          id: crypto.randomUUID(),
          name: '',
        }));
        return [...current, ...extras];
      }
      // Recortar al tamaño elegido (preserva los primeros N)
      return current.slice(0, size);
    });
  };

  /**
   * Cuando cambia el modo: si paso a bracket, sincronizo los inputs al bracketSize.
   * Si paso a liga, dejo lo que haya (el user puede agregar/quitar libremente).
   */
  const handleModeChange = (newMode: TournamentMode) => {
    setMode(newMode);
    if (newMode === 'bracket') {
      handleBracketSizeChange(bracketSize);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const titleValid = validateField('title', title);
    if (titleValid) {
      toast.error(titleValid);
      return;
    }

    const validPlayersCount = players.filter(p => p.name.trim() !== '').length;
    if (validPlayersCount < 2) {
      toast.error(t('versus.errMinPlayers'));
      return;
    }

    // Bloquear nombres repetidos. Recalculamos acá (no leemos el derivado
    // duplicatePlayerIds del render) para defensa en profundidad: si hubiera
    // un race entre el último onChange y el submit, esto agarra el estado real.
    const namesNormalized = players
      .map((p) => p.name.trim().toLowerCase())
      .filter((n) => n !== '');
    if (new Set(namesNormalized).size !== namesNormalized.length) {
      toast.error(t('versus.errDuplicatePlayers'));
      return;
    }

    if (mode === 'bracket') {
      if (bracketSize === 2 && validPlayersCount !== 2) {
        toast.error(t('versus.errExactly2'));
        return;
      }
      if (bracketSize !== 2 && validPlayersCount !== bracketSize) {
        toast.error(t('versus.errExactlyN').replace('{n}', String(bracketSize)));
        return;
      }
    }

    // Calculate expiration date
    const selectedOption = durationOptions.find(opt => opt.value === selectedDuration);
    const durationMs = (selectedOption?.days || 3) * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);

    // Prepare players
    const validPlayers: Player[] = players
      .filter(p => p.name.trim() !== '')
      .map(p => ({
        id: crypto.randomUUID(),
        name: p.name.trim(),
      }));

    // Generate matches based on mode.
    // Bracket: matchupMode applies (auto random, manual respects order)
    // League: always random (no option to choose)
    const randomize = mode === 'league' ? true : matchupMode === 'auto';

    let matches;
    if (mode === 'bracket') {
      // homeAndAway solo aplica a 2 jugadores
      const useHomeAway = bracketSize === 2 && homeAndAway;
      matches = generateBracketMatches(validPlayers, randomize, useHomeAway);
    } else {
      // League: always random
      matches = generateLeagueMatches(validPlayers, true);
    }

    // Create tournament via Supabase (con la duración elegida)
    const token = await createTournament(
      title.trim(),
      username || 'Anónimo',
      mode,
      hasScore,
      validPlayers,
      matches,
      expiresAt
    );

    if (!token) {
      toast.error(t('versus.failedToCreate'));
      return;
    }

    // Guardar en "mis torneos" (localStorage) como creador.
    addMyPoll({
      token,
      type: 'versus',
      title: title.trim(),
      role: 'creator',
      createdBy: username || 'Anónimo',
      expiresAt: expiresAt.toISOString(),
    });

    // Redirect directly to detail page with success flag.
    // Usamos replace (no push) para que el back desde /versus/[token]
    // no traiga al user de nuevo al formulario de creación: el flujo natural
    // post-creación es volver al listado /versus.
    router.replace(`/versus/${token}?created=true`);
  };

  // Check if form can be submitted
  const validPlayers = players.filter(p => p.name.trim() !== '');
  const titleValid = title.trim().length >= 3;
  const hasEnoughPlayers = validPlayers.length >= 2;

  // Set de ids de inputs cuyo nombre (normalizado) aparece más de una vez
  // en el formulario. Lo usamos para:
  //   1) bloquear submit con toast
  //   2) marcar el borde de los inputs duplicados en rojo
  // Normalización: trim + toLowerCase para que "Juan", " juan" y "JUAN"
  // cuenten como el mismo nombre.
  const duplicatePlayerIds: Set<string> = (() => {
    const counts = new Map<string, string[]>();
    for (const p of players) {
      const norm = p.name.trim().toLowerCase();
      if (norm === '') continue;
      const ids = counts.get(norm) ?? [];
      ids.push(p.id);
      counts.set(norm, ids);
    }
    const dupIds = new Set<string>();
    counts.forEach((ids) => {
      if (ids.length > 1) ids.forEach((id) => dupIds.add(id));
    });
    return dupIds;
  })();
  const hasDuplicates = duplicatePlayerIds.size > 0;

  const canSubmit = titleValid && hasEnoughPlayers && !hasDuplicates;

  // Nota: el bracketSize ahora controla la cantidad de inputs (handleBracketSizeChange).
  // No hay sync en sentido inverso — antes había un effect que pisaba la elección del user.

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <button
            onClick={() => safeBack(router, '/versus')}
            className="hidden md:flex items-center gap-2 p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">{t('common.back')}</span>
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-6">{t('versus.createTournament')}</h1>

        <AnonCreateModal />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('versus.tournamentTitleLabel')}
            </label>
            <input
              ref={(el) => registerField('title', el)}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) clearErrors();
              }}
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder={t('versus.tournamentTitlePlaceholder')}
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('versus.modeLabel')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModeChange('bracket')}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  mode === 'bracket'
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                }`}
              >
                🏆 {t('versus.modeBracket')}
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('league')}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  mode === 'league'
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                }`}
              >
                📊 {t('versus.modeLeague')}
              </button>
            </div>
          </div>

          {/* Bracket Size (only for bracket mode) */}
          {mode === 'bracket' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t('versus.playerCountLabel')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {bracketSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleBracketSizeChange(option.value)}
                    className={`px-3 py-3 rounded-lg border-2 transition-all text-sm font-medium flex flex-col items-center gap-1 ${
                      bracketSize === option.value
                        ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                        : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
              {/* Home and away for 2 players */}
              {bracketSize === 2 && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="homeAndAway"
                    checked={homeAndAway}
                    onChange={(e) => setHomeAndAway(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <label htmlFor="homeAndAway" className="text-sm text-[var(--text)]">
                    {t('versus.homeAndAway')}
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Players */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-3">
              {t('versus.playersLabel')}
            </label>

            {/* Render condicional:
                - manual + bracket → pares con "vs" explícito (Match #1: A vs B)
                - resto (auto, o liga) → lista plana
                En liga no hay drag handles porque los partidos siempre son aleatorios */}
            {matchupMode === 'manual' && mode === 'bracket' ? (
              <div className="space-y-3">
                {Array.from({ length: Math.ceil(players.length / 2) }, (_, pairIdx) => {
                  const idxA = pairIdx * 2;
                  const idxB = pairIdx * 2 + 1;
                  const playerA = players[idxA];
                  const playerB = players[idxB];
                  if (!playerA) return null;
                  return (
                    <div
                      key={`pair-${pairIdx}`}
                      className="bg-[var(--surface-2)]/50 border border-[var(--border)] rounded-xl p-3 sm:p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                        {t('versus.matchupsMatchN').replace('{n}', String(pairIdx + 1))}
                      </p>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        {/* Slot A.
                            En mobile (sm:) sacamos el drag handle: alcanza con
                            borrar y reescribir el nombre, o usar Intercambiar.
                            En desktop (sm:+) el drag-drop sigue activo. El input
                            usa pr-8 sólo en desktop para hacer espacio al handle. */}
                        <div
                          onDragOver={onDragOver(idxA)}
                          onDragLeave={onDragLeave}
                          onDrop={onDrop(idxA)}
                          className={`relative rounded-lg transition-all ${
                            dragOverIndex === idxA
                              ? 'ring-2 ring-[var(--primary)] bg-[var(--primary-light)]/30'
                              : ''
                          }`}
                        >
                          <input
                            type="text"
                            value={playerA.name}
                            onChange={(e) => updatePlayer(playerA.id, e.target.value)}
                            className={`w-full px-3 py-3 sm:pr-8 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 text-sm ${
                              duplicatePlayerIds.has(playerA.id)
                                ? 'border-red-500'
                                : 'border-gray-300 dark:border-gray-700'
                            }`}
                            placeholder={t('versus.playerPlaceholder').replace('{n}', String(idxA + 1))}
                            maxLength={50}
                          />
                          {/* Drag handle solo desktop */}
                          <button
                            type="button"
                            draggable
                            onDragStart={onDragStart(idxA)}
                            onDragEnd={onDragEnd}
                            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-muted)] cursor-grab active:cursor-grabbing hover:text-[var(--primary)] touch-none"
                            title={t('versus.movePlayerUp')}
                            aria-label={t('versus.movePlayerUp')}
                          >
                            <GripVertical size={16} />
                          </button>
                        </div>

                        {/* VS divider */}
                        <span className="text-xs sm:text-sm font-extrabold text-[var(--primary)] px-1 sm:px-2 select-none">
                          VS
                        </span>

                        {/* Slot B (mismo criterio: drag handle solo desktop) */}
                        {playerB ? (
                          <div
                            onDragOver={onDragOver(idxB)}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop(idxB)}
                            className={`relative rounded-lg transition-all ${
                              dragOverIndex === idxB
                                ? 'ring-2 ring-[var(--primary)] bg-[var(--primary-light)]/30'
                                : ''
                            }`}
                          >
                            <input
                              type="text"
                              value={playerB.name}
                              onChange={(e) => updatePlayer(playerB.id, e.target.value)}
                              className={`w-full px-3 py-3 sm:pr-8 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 text-sm ${
                                duplicatePlayerIds.has(playerB.id)
                                  ? 'border-red-500'
                                  : 'border-gray-300 dark:border-gray-700'
                              }`}
                              placeholder={t('versus.playerPlaceholder').replace('{n}', String(idxB + 1))}
                              maxLength={50}
                            />
                            <button
                              type="button"
                              draggable
                              onDragStart={onDragStart(idxB)}
                              onDragEnd={onDragEnd}
                              className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-muted)] cursor-grab active:cursor-grabbing hover:text-[var(--primary)] touch-none"
                              title={t('versus.movePlayerUp')}
                              aria-label={t('versus.movePlayerUp')}
                            >
                              <GripVertical size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="px-3 py-3 border border-dashed border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)] text-center">—</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((player, index) => {
                  const isManual = matchupMode === 'manual' && mode === 'bracket';
                  const isDragOver = dragOverIndex === index;
                  return (
                    <div
                      key={player.id}
                      onDragOver={isManual ? onDragOver(index) : undefined}
                      onDragLeave={isManual ? onDragLeave : undefined}
                      onDrop={isManual ? onDrop(index) : undefined}
                      className={`flex items-center gap-2 rounded-lg transition-colors ${
                        isDragOver ? 'bg-[var(--primary-light)]/30 ring-2 ring-[var(--primary)]' : ''
                      }`}
                    >
                      {/* Drag handle (desktop only, visible solo en bracket manual) */}
                      {isManual && (
                        <button
                          type="button"
                          draggable
                          onDragStart={onDragStart(index)}
                          onDragEnd={onDragEnd}
                          className="hidden sm:flex p-2 text-[var(--text-muted)] cursor-grab active:cursor-grabbing hover:text-[var(--primary)] touch-none"
                          title={t('versus.movePlayerUp')}
                          aria-label={t('versus.movePlayerUp')}
                        >
                          <GripVertical size={18} />
                        </button>
                      )}

                      {/* Number badge solo en bracket manual */}
                      {isManual && (
                        <span className="hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--surface-2)] text-xs font-bold text-[var(--text-muted)] flex-shrink-0">
                          {index + 1}
                        </span>
                      )}

                      <div className="flex-1">
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => updatePlayer(player.id, e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 ${
                            duplicatePlayerIds.has(player.id)
                              ? 'border-red-500'
                              : 'border-gray-300 dark:border-gray-700'
                          }`}
                          placeholder={t('versus.playerPlaceholder').replace('{n}', String(index + 1))}
                          maxLength={50}
                        />
                      </div>

                      {/* Up/down buttons (mobile bracket manual + accesibilidad teclado) */}
                      {isManual && (
                        <div className="flex sm:hidden flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => reorderPlayers(index, index - 1)}
                            disabled={index === 0}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={t('versus.movePlayerUp')}
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => reorderPlayers(index, index + 1)}
                            disabled={index === players.length - 1}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={t('versus.movePlayerDown')}
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      )}

                      {/* Sólo en liga el user puede borrar players manualmente.
                          En bracket, el size lo controla el segmented control de arriba. */}
                      {mode === 'league' && players.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePlayer(player.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                          title={t('versus.removePlayer')}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {mode === 'league' && (
              <button
                type="button"
                onClick={addPlayer}
                className="mt-3 px-4 py-2 bg-[var(--surface-2)] text-[var(--primary)] rounded-lg hover:bg-[var(--surface)] transition-colors font-medium flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                {t('versus.addPlayer')}
              </button>
            )}
            {errors.players && <p className="mt-1 text-sm text-red-600">{errors.players}</p>}
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {mode === 'bracket'
                ? t('versus.currentPlayersBracket')
                    .replace('{n}', String(validPlayers.length))
                    .replace('{req}', String(bracketSize))
                : t('versus.currentPlayersLeague').replace('{n}', String(validPlayers.length))}
            </p>
            {matchupMode === 'manual' && mode === 'bracket' && (
              <p className="mt-1 text-xs text-[var(--primary)]">
                {t('versus.matchupsBracketHint')}
              </p>
            )}
            {hasDuplicates && (
              <p className="mt-1 text-xs text-red-600">
                {t('versus.errDuplicatePlayers')}
              </p>
            )}
          </div>

          {/* Matchups: ¿quién arma los partidos? (auto random o manual) - solo para bracket */}
          {mode === 'bracket' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t('versus.matchupsLabel')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMatchupMode('auto')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium text-left ${
                    matchupMode === 'auto'
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                  }`}
                >
                  <div className="font-semibold">{t('versus.matchupsAuto')}</div>
                  <div className="text-xs opacity-70 mt-0.5">{t('versus.matchupsAutoDesc')}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMatchupMode('manual')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium text-left ${
                    matchupMode === 'manual'
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                  }`}
                >
                  <div className="font-semibold">{t('versus.matchupsManual')}</div>
                  <div className="text-xs opacity-70 mt-0.5">{t('versus.matchupsManualDesc')}</div>
                </button>
              </div>

              {/* Antes había un preview de pares acá. Lo sacamos porque ahora los pares
                  se ven directamente en el listado de inputs (con "VS" entre cada par)
                  cuando matchupMode === 'manual' && mode === 'bracket'. */}
            </div>
          )}

          {/* Score Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('versus.scoreTypeLabel')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasScore(true)}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  hasScore
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                }`}
              >
                {t('versus.scoreTypeWithScore')}
              </button>
              <button
                type="button"
                onClick={() => setHasScore(false)}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  !hasScore
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                }`}
              >
                {t('versus.scoreTypeNoScore')}
              </button>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('versus.durationLabel')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedDuration(option.value)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedDuration === option.value
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {t('versus.tournamentExpires').replace('{duration}', durationOptions.find(d => d.value === selectedDuration)?.label || '')}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('versus.createTournament')}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}
