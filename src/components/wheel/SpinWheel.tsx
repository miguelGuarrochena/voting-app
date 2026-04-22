'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Trash2, Share2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import ConfirmModal from '@/components/modals/ConfirmModal';

interface WheelOption {
  id: string;
  text: string;
  color: string;
}

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', 
  '#BB8FCE', '#85C1E2', '#F8B500', '#52C234',
  '#FF4757', '#5F27CD', '#00D2D3', '#FFA502'
];

export const SpinWheel = () => {
  const { t, language } = useLanguage();
  const [options, setOptions] = useState<WheelOption[]>([
    { id: '1', text: '', color: DEFAULT_COLORS[0] },
    { id: '2', text: '', color: DEFAULT_COLORS[1] },
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOption, setSelectedOption] = useState<WheelOption | null>(null);
  const [newOptionText, setNewOptionText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [addingAfterId, setAddingAfterId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [showClearModal, setShowClearModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const currentAngleRef = useRef<number>(0);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const drawWheel = useCallback((
    opts: WheelOption[],
    sel: WheelOption | null,
    showRes: boolean
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;
    const actualWidth = window.innerWidth < 1024 ? 280 : 400;
    const actualHeight = actualWidth;
    canvas.width = actualWidth * scale;
    canvas.height = actualHeight * scale;
    canvas.style.width = actualWidth + 'px';
    canvas.style.height = actualHeight + 'px';
    ctx.scale(scale, scale);

    const centerX = actualWidth / 2;
    const centerY = actualHeight / 2;
    const radius = Math.min(centerX, centerY) - 30;

    ctx.clearRect(0, 0, actualWidth, actualHeight);
    if (opts.length === 0) return;

    const anglePerOption = (2 * Math.PI) / opts.length;

    opts.forEach((option, index) => {
      const startAngle = index * anglePerOption - Math.PI / 2;
      const endAngle = (index + 1) * anglePerOption - Math.PI / 2;
      const isSelected = sel && sel.id === option.id && showRes;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = option.color;
      ctx.fill();

      if (isSelected) {
        // Resaltado brillante para la opción seleccionada
        ctx.shadowColor = option.color;
        ctx.shadowBlur = 25;
        
        // Dibujar un borde brillante adicional
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Dibujar un segundo borde con el color de la opción
        ctx.strokeStyle = option.color;
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // Restaurar el borde blanco principal
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerOption / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = isSelected ? '#ffffff' : '#ffffff';

      // Truncate text if too long and adjust font size
      const maxTextLength = 10;
      let displayText = option.text;
      if (displayText.length > maxTextLength) {
        displayText = displayText.substring(0, maxTextLength - 1) + '...';
      }

      const fontSize = isSelected ?
        (displayText.length > 8 ? 'bold 14px Sora' : 'bold 18px Sora') :
        (displayText.length > 8 ? 'bold 11px Sora' : 'bold 14px Sora');
      ctx.font = fontSize;

      if (isSelected) {
        // Texto resaltado para opción seleccionada
        ctx.shadowColor = option.color;
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
      }

      // Position text closer to center to prevent overflow
      const textRadius = radius * 0.5; // Further reduced to prevent overflow
      ctx.fillText(displayText, textRadius, 0);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  useEffect(() => {
    drawWheel(options, selectedOption, showResult);
  }, [options, selectedOption, showResult, drawWheel]);

  useEffect(() => {
    // Redraw wheel when step changes to ensure it's visible
    if (step === 2) {
      setTimeout(() => {
        drawWheel(options, selectedOption, showResult);
      }, 100);
    }
  }, [step, options, selectedOption, showResult]);

  useEffect(() => {
    if (addingAfterId) {
      setEditingId(addingAfterId);
      setEditingText('');
      setAddingAfterId(null);
    }
  }, [addingAfterId]);

  // Función para asegurar colores únicos
  const ensureUniqueColors = useCallback((opts: WheelOption[]) => {
    return opts.map((option, index) => ({
      ...option,
      color: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    }));
  }, []);

  // Funciones para editar opciones
  const startEditing = useCallback((option: WheelOption) => {
    setEditingId(option.id);
    setEditingText(option.text);
    setValidationError('');
  }, []);

  const saveEditing = useCallback(() => {
    if (!editingText.trim()) {
      setValidationError(t('spin.optionTextCannotBeEmpty'));
      return;
    }
    
    setOptions(prev => {
      const updated = prev.map(opt => 
        opt.id === editingId ? { ...opt, text: editingText.trim() } : opt
      );
      return ensureUniqueColors(updated);
    });
    
    setEditingId(null);
    setEditingText('');
    setValidationError('');
  }, [editingId, editingText, ensureUniqueColors]);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditingText('');
    setValidationError('');
  }, []);

  // Función para agregar opción después de una específica
  const addOptionAfter = useCallback((afterId: string) => {
    setValidationError('');
    if (options.length >= 12) { 
      setValidationError(t('spin.maximumTwelveOptions')); 
      return; 
    }
    
    const afterIndex = options.findIndex(opt => opt.id === afterId);
    if (afterIndex === -1) return;
    
    const newOption: WheelOption = {
      id: Date.now().toString(),
      text: '',
      color: DEFAULT_COLORS[options.length % DEFAULT_COLORS.length]
    };
    
    const updatedOptions = [...options];
    updatedOptions.splice(afterIndex + 1, 0, newOption);
    const finalOptions = ensureUniqueColors(updatedOptions);
    
    setOptions(finalOptions);
    setAddingAfterId(newOption.id); // Auto-editar la nueva opción
  }, [options, ensureUniqueColors]);

  const addOption = useCallback(() => {
    setValidationError('');
    if (!newOptionText.trim()) { setValidationError(t('spin.pleaseEnterAnOption')); return; }
    if (options.length >= 12) { setValidationError(t('spin.maximumTwelveOptions')); return; }
    
    const newOption: WheelOption = {
      id: Date.now().toString(),
      text: newOptionText.trim(),
      color: DEFAULT_COLORS[options.length % DEFAULT_COLORS.length]
    };
    
    const updatedOptions = ensureUniqueColors([...options, newOption]);
    setOptions(updatedOptions);
    setNewOptionText('');
  }, [newOptionText, options, ensureUniqueColors]);

  const removeOption = useCallback((id: string) => {
    if (options.length <= 2) { setValidationError(t('spin.minimumTwoOptions')); return; }
    setValidationError('');
    const filteredOptions = options.filter(opt => opt.id !== id);
    const updatedOptions = ensureUniqueColors(filteredOptions);
    setOptions(updatedOptions);
  }, [options, ensureUniqueColors]);

  const clearAll = useCallback(() => {
    setOptions([
      { id: '1', text: '', color: DEFAULT_COLORS[0] },
      { id: '2', text: '', color: DEFAULT_COLORS[1] },
    ]);
    setValidationError('');
    setSelectedOption(null);
    setShowResult(false);
  }, []);

  const spin = useCallback(() => {
    if (isSpinning || options.length < 2) return;
    setValidationError('');
    setIsSpinning(true);
    setShowResult(false);
    setSelectedOption(null);

    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 360;
    const randomExtra = Math.floor(Math.random() * 360);
    const finalAngle = currentAngleRef.current + extraSpins + randomExtra;

    const wheelEl = wheelRef.current;
    if (!wheelEl) return;

    wheelEl.style.transition = 'none';
    wheelEl.style.transform = `rotate(${currentAngleRef.current}deg)`;
    wheelEl.getBoundingClientRect();
    wheelEl.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wheelEl.style.transform = `rotate(${finalAngle}deg)`;

    const onEnd = () => {
      wheelEl.removeEventListener('transitionend', onEnd);

      const stoppedAngle = finalAngle % 360;
      currentAngleRef.current = stoppedAngle;

      const currentOptions = optionsRef.current;
      const sectorAngle = 360 / currentOptions.length;

      // El marcador apunta arriba (12 en punto).
      // La rueda giró `stoppedAngle` grados en sentido horario.
      // Para encontrar qué sector está bajo el marcador,
      // invertimos la rotación y ajustamos el offset de -90° del canvas.
      const normalizedAngle = (((-stoppedAngle) % 360) + 360) % 360;
      const adjustedAngle = (normalizedAngle + 90 + 360) % 360;
      const winningIndex = Math.floor(adjustedAngle / sectorAngle) % currentOptions.length;
      const winner = currentOptions[winningIndex];

      setSelectedOption(winner);
      setShowResult(true);
      setIsSpinning(false);
      confetti({ particleCount: 120, spread: 90, colors: ['#FF4D6A', '#FFD700', '#2DD4A0', '#FFF8FA'] });
    };

    wheelEl.addEventListener('transitionend', onEnd);
  }, [isSpinning, options]);

  const spinAgain = useCallback(() => {
    setSelectedOption(null);
    setShowResult(false);
    setValidationError('');
    setShareCopied(false);
    // Iniciar un nuevo giro inmediatamente
    setTimeout(() => spin(), 100); // Pequeño delay para que el UI se actualice
  }, [spin]);

  // ----------------------------------------------------------------
  //  Share — captura el contenedor completo (rueda + resultado) con html2canvas,
  //  similar a Versus, con fallback a texto si falla.
  // ----------------------------------------------------------------
  const handleShareResult = useCallback(async () => {
    if (!selectedOption || !captureRef.current) return;

    const text =
      t('spin.shareText').replace('{option}', selectedOption.text) +
      ' ' +
      t('spin.inPickly');

    try {
      // Capture container as image
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true,
      });

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Copy image to clipboard
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setShareCopied(true);
          toast.success(t('spin.resultCopied'));
          setTimeout(() => setShareCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy image:', err);
          // Fallback: download the image
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `wheel-result-${selectedOption.text}.png`;
          link.href = url;
          link.click();
          toast.success(t('spin.resultDownloaded'));
        }
      });
    } catch (err) {
      console.error('Failed to capture container:', err);
      // Fallback: Web Share API with text (mobile)
      try {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: t('spin.theWheelHasSpoken'),
            text,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
          });
          return;
        }
      } catch {
        // Usuario canceló el share nativo → seguimos al clipboard
      }

      // Final fallback: clipboard text
      try {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        toast.success(t('spin.resultCopied'));
        setTimeout(() => setShareCopied(false), 2000);
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  }, [selectedOption, t]);

  const isFormValid = newOptionText.trim().length > 0 && options.length < 12;
  const canSpin = options.filter(opt => opt.text.trim().length > 0).length >= 2 && !isSpinning;

  return (
    <div className="min-h-screen bg-[var(--bg)] relative overflow-hidden">
      {/* Add padding to account for fixed navbar */}
      <div className="pt-0 lg:pt-20" />

      <div className="pt-0 pb-12 px-4 lg:py-12">
        <div className="max-w-6xl mx-auto relative">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="lg:hidden font-display text-2xl md:text-3xl font-bold text-[var(--text)] mb-4">
              {t('spin.title')} <span className="text-gradient">{t('spin.titleHighlight')}</span>
            </h1>
            <h1 className="hidden lg:block font-display text-4xl md:text-6xl font-bold text-[var(--text)] mb-4">
              {t('spin.title')} <span className="text-gradient">{t('spin.titleHighlight')}</span>
            </h1>
            <p className="font-body text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
              {t('spin.subtitle')}
            </p>
          </motion.div>

          {/* Mobile Stepper Indicator */}
          <div className="lg:hidden flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${step === 1 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
                <span className="font-bold">1</span>
                <span>{t('spin.configureOptions')}</span>
              </div>
              <div className="w-4 h-0.5 bg-[var(--border)]" />
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${step === 2 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
                <span className="font-bold">2</span>
                <span>{t('spin.spinWheel')}</span>
              </div>
            </div>
          </div>

          {/* Desktop: Show both wheel and options side by side */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-12 items-start">
            <motion.div className="flex flex-col items-center" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
              <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] border border-[var(--border)] p-4 lg:p-8 w-full">
                <div ref={captureRef} className="flex flex-col items-center">
                  <div className="relative w-[280px] h-[280px] lg:w-[400px] lg:h-[400px] max-w-full mx-auto">

                    <div ref={wheelRef} style={{ width: '100%', height: '100%' }}>
                      <canvas ref={canvasRef} className="w-full h-full" />
                    </div>


                    <button
                      onClick={spin}
                      disabled={!canSpin}
                      className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${
                        canSpin
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white'
                          : 'bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed opacity-50'
                      }`}
                    >
                      {isSpinning ? t('spin.spinning') : t('spin.spin')}
                    </button>
                  </div>

                  <AnimatePresence>
                    {validationError && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-3 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-red-700 text-sm text-center">
                        {validationError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showResult && selectedOption && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        className="mt-8 p-6 bg-gradient-to-r from-[var(--primary-light)] to-[var(--primary-light)/50] rounded-[var(--radius-lg)] text-center border border-[var(--primary-light)]">
                        <div className="text-3xl mb-3">🎉</div>
                        <h3 className="font-display text-xl font-bold text-[var(--text)] mb-2">{t('spin.theWheelHasSpoken')}</h3>
                        <div className="text-2xl font-bold text-[var(--primary)] mb-4">{selectedOption.text}</div>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <button onClick={handleShareResult}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-[var(--primary)] text-white rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors">
                            {shareCopied ? <Check size={16} /> : <Share2 size={16} />}
                          {shareCopied ? t('spin.resultCopied') : t('spin.shareResult')}
                        </button>
                        <button onClick={spinAgain}
                          className="px-5 py-2 bg-[var(--surface)] text-[var(--primary)] rounded-full font-medium hover:bg-[var(--surface-2)] transition-colors border border-[var(--primary)]">
                          {t('spin.spinAgain')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              </div>
            </motion.div>

            <motion.div className="space-y-6 order-1 lg:order-2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
              {/* Add Option - Eliminado, ahora está integrado en cada opción */}

              <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--border)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-[var(--text)]">{t('spin.currentOptions')}</h3>
                  {options.some(opt => opt.text.trim() !== '') && (
                    <button
                      onClick={() => setShowClearModal(true)}
                      className="text-sm px-3 py-1.5 border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 rounded-lg transition-colors font-medium"
                    >
                      {t('spin.clearAll')}
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {options.map((option, index) => (
                    <div key={option.id}>
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
                        
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editingId === option.id ? editingText : option.text}
                            onChange={(e) => {
                              if (editingId === option.id) {
                                setEditingText(e.target.value);
                              } else {
                                setEditingId(option.id);
                                setEditingText(e.target.value);
                              }
                            }}
                            onBlur={() => {
                              if (editingId === option.id && option.text.trim()) {
                                // Solo guardar si ya tiene texto
                                saveEditing();
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && editingId === option.id) {
                                saveEditing();
                              }
                            }}
                            placeholder={`${t('spin.optionPlaceholder')} ${index + 1}`}
                            className="flex-1 px-3 py-2 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors"
                            maxLength={30}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Botón Add to Wheel - solo para opciones nuevas vacías */}
                          {editingId === option.id && !option.text.trim() && (
                            <button 
                              onClick={saveEditing}
                              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                            >
                              {t('spin.addToWheel')}
                            </button>
                          )}
                          
                          {/* Botón Add */}
                          {options.length < 12 && (
                            <button 
                              onClick={() => addOptionAfter(option.id)}
                              className="p-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
                              title={t('spin.addOptionAfterThis')}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          )}
                          
                          {/* Botón Delete */}
                          {options.length > 2 && (
                            <button onClick={() => removeOption(option.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title={t('spin.removeOption')}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
                {options.length < 2 && (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <ArrowPathIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>{t('spin.enterAtLeastTwoOptions')}</p>
                  </div>
                )}
              </div>

              <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--border)] p-6">
                <h3 className="font-display text-xl font-bold text-[var(--text)] mb-4">{t('spin.quickTemplates')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: '🤔', label: t('spin.yesOrNo'), opts: language === 'es' ? ['Sí', 'No'] : ['Yes', 'No'] },
                    { emoji: '🍕', label: t('spin.foodChoice'), opts: language === 'es' ? ['Pizza', 'Sushi', 'Hamburguesa', 'Pasta'] : ['Pizza', 'Sushi', 'Burger', 'Pasta'] },
                    { emoji: '🎮', label: t('spin.activities'), opts: language === 'es' ? ['Película', 'Videojuegos', 'Leer', 'Caminar', 'Música', 'Ejercicio'] : ['Movie', 'Gaming', 'Reading', 'Walk', 'Music', 'Exercise'] },
                    { emoji: '🎲', label: t('spin.numbers'), opts: ['1','2','3','4','5','6'].map(n => language === 'es' ? `Número ${n}` : `Number ${n}`) },
                  ].map(({ emoji, label, opts }) => (
                    <button key={label}
                      onClick={() => { 
                        const newOptions = opts.map((text, i) => ({ 
                          id: (i+1).toString(), 
                          text, 
                          color: DEFAULT_COLORS[i % DEFAULT_COLORS.length] 
                        })); 
                        setOptions(newOptions); 
                        setValidationError(''); 
                        // Resetear el resultado anterior
                        setSelectedOption(null);
                        setShowResult(false);
                      }}
                      className="p-3 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-[var(--radius-md)] text-center transition-colors border border-[var(--border)]">
                      <div className="text-lg mb-1">{emoji}</div>
                      <div className="text-sm font-medium text-[var(--text)]">{label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile: Stepper flow */}
          <div className="lg:hidden space-y-4">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-base font-bold text-[var(--text)]">{t('spin.currentOptions')}</h3>
                    {options.some(opt => opt.text.trim() !== '') && (
                      <button
                        onClick={() => setShowClearModal(true)}
                        className="text-xs px-2 py-1 border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 rounded-lg transition-colors font-medium"
                      >
                        {t('spin.clearAll')}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {options.map((option, index) => (
                      <div key={option.id}>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                          className="flex items-center gap-3 p-2 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />

                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={editingId === option.id ? editingText : option.text}
                              onChange={(e) => {
                                if (editingId === option.id) {
                                  setEditingText(e.target.value);
                                } else {
                                  setEditingId(option.id);
                                  setEditingText(e.target.value);
                                }
                              }}
                              onBlur={() => {
                                if (editingId === option.id && option.text.trim()) {
                                  saveEditing();
                                }
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && editingId === option.id) {
                                  saveEditing();
                                }
                              }}
                              placeholder={`${t('spin.optionPlaceholder')} ${index + 1}`}
                              className="flex-1 px-3 py-2 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-sm"
                              maxLength={30}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            {editingId === option.id && !option.text.trim() && (
                              <button
                                onClick={saveEditing}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                title={t('spin.addToWheel')}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}

                            {options.length < 12 && (
                              <button
                                onClick={() => addOptionAfter(option.id)}
                                className="p-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
                                title={t('spin.addOptionAfterThis')}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            )}

                            {options.length > 2 && (
                              <button onClick={() => removeOption(option.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title={t('spin.removeOption')}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                  {options.length < 2 && (
                    <div className="text-center py-4 text-[var(--text-muted)]">
                      <ArrowPathIcon className="w-9 h-9 mx-auto mb-1" />
                      <p className="text-sm">{t('spin.enterAtLeastTwoOptions')}</p>
                    </div>
                  )}
                </div>

                <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--border)] p-4">
                  <h3 className="font-display text-base font-bold text-[var(--text)] mb-3">{t('spin.quickTemplates')}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { emoji: '🤔', label: t('spin.yesOrNo'), opts: language === 'es' ? ['Sí', 'No'] : ['Yes', 'No'] },
                      { emoji: '🍕', label: t('spin.foodChoice'), opts: language === 'es' ? ['Pizza', 'Sushi', 'Hamburguesa', 'Pasta'] : ['Pizza', 'Sushi', 'Burger', 'Pasta'] },
                      { emoji: '🎮', label: t('spin.activities'), opts: language === 'es' ? ['Película', 'Videojuegos', 'Leer', 'Caminar', 'Música', 'Ejercicio'] : ['Movie', 'Gaming', 'Reading', 'Walk', 'Music', 'Exercise'] },
                      { emoji: '🎲', label: t('spin.numbers'), opts: ['1','2','3','4','5','6'].map(n => language === 'es' ? `Número ${n}` : `Number ${n}`) },
                    ].map(({ emoji, label, opts }) => (
                      <button key={label}
                        onClick={() => {
                          const newOptions = opts.map((text, i) => ({
                            id: (i+1).toString(),
                            text,
                            color: DEFAULT_COLORS[i % DEFAULT_COLORS.length]
                          }));
                          setOptions(newOptions);
                          setValidationError('');
                        }}
                        className="p-2 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-[var(--radius-md)] text-center transition-colors border border-[var(--border)]">
                        <div className="text-lg mb-1">{emoji}</div>
                        <div className="text-sm font-medium text-[var(--text)]">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {options.length >= 2 && (
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
                  >
                    {t('spin.continueToWheel')}
                  </button>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-center"
              >
                <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] border border-[var(--border)] p-4 w-full">
                  <div ref={captureRef} className="flex flex-col items-center">
                    <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
                      <div ref={wheelRef} style={{ width: '100%', height: '100%' }}>
                        <canvas ref={canvasRef} className="w-full h-full" />
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={spin}
                        disabled={!canSpin}
                        className="w-full py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold text-base rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSpinning ? t('spin.spinning') : showResult ? t('spin.spinAgain') : t('spin.spin')}
                      </button>
                      {!canSpin && !isSpinning && (
                        <p className="text-xs text-center text-gray-400 mt-2">
                          {t('spin.enterAtLeastTwoOptions')}
                        </p>
                      )}
                    </div>

                    <AnimatePresence>
                      {validationError && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-red-700 text-sm text-center">
                          {validationError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {showResult && selectedOption && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          className="mt-3 p-3 bg-gradient-to-r from-[var(--primary-light)] to-[var(--primary-light)/50] rounded-[var(--radius-lg)] text-center border border-[var(--primary-light)]">
                          <div className="text-2xl mb-2">🎉</div>
                          <h3 className="font-display text-lg font-bold text-[var(--text)] mb-1">{t('spin.theWheelHasSpoken')}</h3>
                          <div className="text-xl font-bold text-[var(--primary)] mb-2">{selectedOption.text}</div>
                          <div className="flex flex-col gap-2 items-center">
                            <button onClick={handleShareResult}
                              className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-[var(--primary)] text-white rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm">
                              {shareCopied ? <Check size={14} /> : <Share2 size={14} />}
                              {shareCopied ? t('spin.resultCopied') : t('spin.shareResult')}
                            </button>
                            <button onClick={spinAgain}
                              className="px-4 py-1.5 bg-[var(--surface)] text-[var(--primary)] rounded-full font-medium hover:bg-[var(--surface-2)] transition-colors border border-[var(--primary)] text-sm">
                              {t('spin.spinAgain')}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="mt-4 px-5 py-2 bg-[var(--surface-2)] text-[var(--text)] rounded-full font-medium hover:bg-[var(--surface-3)] transition-colors border border-[var(--border)] text-sm"
                >
                  ← {t('spin.editOptions')}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={clearAll}
        title={t('spin.clearAllModalTitle')}
        subtitle={t('spin.clearAllModalSubtitle')}
        cancelText={t('spin.cancel')}
        confirmText={t('spin.clear')}
      />
    </div>
  );
};
