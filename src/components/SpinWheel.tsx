'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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

export function SpinWheel() {
  const [options, setOptions] = useState<WheelOption[]>([
    { id: '1', text: 'Option 1', color: DEFAULT_COLORS[0] },
    { id: '2', text: 'Option 2', color: DEFAULT_COLORS[1] },
    { id: '3', text: 'Option 3', color: DEFAULT_COLORS[2] },
    { id: '4', text: 'Option 4', color: DEFAULT_COLORS[3] },
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [idleRotation, setIdleRotation] = useState(0);
  const [selectedOption, setSelectedOption] = useState<WheelOption | null>(null);
  const [newOptionText, setNewOptionText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [validationError, setValidationError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Occasional idle rotation
  useEffect(() => {
    if (isSpinning) return;
    
    const interval = setInterval(() => {
      setIdleRotation(prev => prev + (Math.random() - 0.5) * 10);
    }, 3000 + Math.random() * 2000);
    
    return () => clearInterval(interval);
  }, [isSpinning]);

  // Draw the wheel on canvas
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (options.length === 0) return;
    
    const anglePerOption = (2 * Math.PI) / options.length;
    
    options.forEach((option, index) => {
      const startAngle = index * anglePerOption - Math.PI / 2;
      const endAngle = (index + 1) * anglePerOption - Math.PI / 2;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = option.color;
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerOption / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Sora';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(option.text, radius * 0.65, 0);
      ctx.restore();
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 10, centerY);
    ctx.lineTo(centerX + radius - 20, centerY - 15);
    ctx.lineTo(centerX + radius - 20, centerY + 15);
    ctx.closePath();
    ctx.fillStyle = 'var(--primary)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [options]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const scale = window.devicePixelRatio || 1;
      canvas.width = 400 * scale;
      canvas.height = 400 * scale;
      canvas.style.width = '400px';
      canvas.style.height = '400px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
      }
      
      drawWheel();
    }
  }, [drawWheel]);

  const addOption = useCallback(() => {
    setValidationError('');
    
    if (!newOptionText.trim()) {
      setValidationError('Please enter an option');
      return;
    }
    
    if (options.length >= 12) {
      setValidationError('Maximum 12 options allowed');
      return;
    }
    
    const newOption: WheelOption = {
      id: Date.now().toString(),
      text: newOptionText.trim(),
      color: DEFAULT_COLORS[options.length % DEFAULT_COLORS.length]
    };
    
    setOptions([...options, newOption]);
    setNewOptionText('');
  }, [newOptionText, options]);

  const removeOption = useCallback((id: string) => {
    if (options.length <= 2) {
      setValidationError('Minimum 2 options required');
      return;
    }
    setValidationError('');
    setOptions(options.filter(opt => opt.id !== id));
  }, [options]);

  const spin = useCallback(async () => {
    if (isSpinning) return;
    
    if (options.length < 2) {
      setValidationError('Add at least 2 options to spin');
      return;
    }
    
    setValidationError('');
    setIsSpinning(true);
    setShowResult(false);
    setSelectedOption(null);
    setIdleRotation(0);
    
    const minSpins = 5;
    const maxSpins = 8;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const randomAngle = Math.random() * 360;
    const totalRotation = spins * 360 + randomAngle;
    
    setRotation(prev => prev + totalRotation);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const normalizedAngle = (360 - (randomAngle % 360) + 90) % 360;
    const anglePerOption = 360 / options.length;
    const winningIndex = Math.floor(normalizedAngle / anglePerOption);
    const winner = options[winningIndex];
    
    setSelectedOption(winner);
    setShowResult(true);
    setIsSpinning(false);
    
    confetti({
      particleCount: 120,
      spread: 90,
      colors: ['#FF4D6A', '#FFD700', '#2DD4A0', '#FFF8FA']
    });
  }, [isSpinning, options]);

  const reset = useCallback(() => {
    setSelectedOption(null);
    setShowResult(false);
    setRotation(0);
    setIdleRotation(0);
    setValidationError('');
  }, []);

  const isFormValid = newOptionText.trim().length > 0 && options.length < 12;
  const canSpin = options.length >= 2 && !isSpinning;

  return (
    <div className="min-h-screen bg-[var(--bg)] relative overflow-hidden">
      {/* Mobile Header with Back Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>
          <h1 className="font-display text-lg font-bold text-[var(--primary)]">Spin Wheel</h1>
          <div className="w-8" />
        </div>
      </div>
      
      {/* Add padding for mobile header */}
      <div className="lg:hidden pt-16" />
      
      <div className="py-12 px-4">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--primary-light)] opacity-30 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--primary-light)] opacity-20 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
        
        <div className="max-w-6xl mx-auto relative">
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="hidden lg:block font-display text-4xl md:text-6xl font-bold text-[var(--text)] mb-4">
              Spin the <span className="text-gradient">Wheel</span>
            </h1>
            <p className="font-body text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
              Can't decide? Let fate choose! Add your options and give the wheel a spin.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Wheel Section */}
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] border border-[var(--border)] p-8 w-full">
                <div 
                  ref={wheelRef}
                  className="relative w-[400px] h-[400px] max-w-full mx-auto"
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                  />
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ 
                      rotate: isSpinning ? rotation + idleRotation : idleRotation 
                    }}
                    transition={{ 
                      duration: isSpinning ? 4 : 2, 
                      ease: isSpinning ? [0.17, 0.67, 0.12, 0.99] : [0.25, 0.46, 0.45, 0.94] 
                    }}
                  >
                    <button
                      onClick={spin}
                      disabled={!canSpin}
                      className={`w-16 h-16 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                        canSpin 
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:shadow-lg' 
                          : 'bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed opacity-50'
                      }`}
                    >
                      {isSpinning ? '...' : 'SPIN'}
                    </button>
                  </motion.div>
                </div>
              
              {/* Validation Error */}
              <AnimatePresence>
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-red-700 text-sm text-center"
                  >
                    {validationError}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Result Display */}
              <AnimatePresence>
                {showResult && selectedOption && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="mt-8 p-6 bg-gradient-to-r from-[var(--primary-light)] to-[var(--primary-light)/50] rounded-[var(--radius-lg)] text-center border border-[var(--primary-light)]"
                  >
                    <div className="text-3xl mb-3">🎉</div>
                    <h3 className="font-display text-xl font-bold text-[var(--text)] mb-2">
                      The wheel has spoken!
                    </h3>
                    <div className="text-2xl font-bold text-[var(--primary)] mb-4">
                      {selectedOption.text}
                    </div>
                    <button
                      onClick={reset}
                      className="px-6 py-2 bg-[var(--surface)] text-[var(--primary)] rounded-full font-medium hover:bg-[var(--surface-2)] transition-colors border border-[var(--primary)]"
                    >
                      Spin Again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </motion.div>

            {/* Controls Section */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Add Option */}
              <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--border)] p-6">
                <h3 className="font-display text-xl font-bold text-[var(--text)] mb-4">Add Options</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => {
                      setNewOptionText(e.target.value);
                      setValidationError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && addOption()}
                    placeholder="Enter an option..."
                    className="flex-1 px-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-[var(--text-muted)]"
                    maxLength={30}
                  />
                  <button
                    onClick={addOption}
                    disabled={!isFormValid}
                    className={`px-6 py-3 rounded-[var(--radius-md)] font-medium transition-all ${
                      isFormValid
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:shadow-lg'
                        : 'bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed opacity-50'
                    }`}
                  >
                    Add
                  </button>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  {options.length}/12 options (minimum 2 required to spin)
                </p>
              </div>

              {/* Options List */}
              <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--border)] p-6">
                <h3 className="font-display text-xl font-bold text-[var(--text)] mb-4">Current Options</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {options.map((option, index) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-[var(--radius-md)]"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="flex-1 font-medium text-[var(--text)]">
                        {index + 1}. {option.text}
                      </span>
                      {options.length > 2 && (
                        <button
                          onClick={() => removeOption(option.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove option"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {options.length < 2 && (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>Add at least 2 options to start spinning!</p>
                  </div>
                )}
              </div>

              {/* Quick Templates */}
              <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--border)] p-6">
                <h3 className="font-display text-xl font-bold text-[var(--text)] mb-4">Quick Templates</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setOptions([
                        { id: '1', text: 'Yes', color: DEFAULT_COLORS[0] },
                        { id: '2', text: 'No', color: DEFAULT_COLORS[1] },
                      ]);
                      setValidationError('');
                    }}
                    className="p-3 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-[var(--radius-md)] text-center transition-colors border border-[var(--border)]"
                  >
                    <div className="text-lg mb-1">🤔</div>
                    <div className="text-sm font-medium text-[var(--text)]">Yes or No</div>
                  </button>
                  <button
                    onClick={() => {
                      setOptions([
                        { id: '1', text: 'Pizza', color: DEFAULT_COLORS[0] },
                        { id: '2', text: 'Sushi', color: DEFAULT_COLORS[1] },
                        { id: '3', text: 'Burger', color: DEFAULT_COLORS[2] },
                        { id: '4', text: 'Pasta', color: DEFAULT_COLORS[3] },
                      ]);
                      setValidationError('');
                    }}
                    className="p-3 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-[var(--radius-md)] text-center transition-colors border border-[var(--border)]"
                  >
                    <div className="text-lg mb-1">🍕</div>
                    <div className="text-sm font-medium text-[var(--text)]">Food Choice</div>
                  </button>
                  <button
                    onClick={() => {
                      const activities = ['Movie', 'Gaming', 'Reading', 'Walk', 'Music', 'Exercise'];
                      setOptions(activities.map((text, index) => ({
                        id: (index + 1).toString(),
                        text,
                        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                      })));
                      setValidationError('');
                    }}
                    className="p-3 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-[var(--radius-md)] text-center transition-colors border border-[var(--border)]"
                  >
                    <div className="text-lg mb-1">🎮</div>
                    <div className="text-sm font-medium text-[var(--text)]">Activities</div>
                  </button>
                  <button
                    onClick={() => {
                      const numbers = ['1', '2', '3', '4', '5', '6'];
                      setOptions(numbers.map((text, index) => ({
                        id: (index + 1).toString(),
                        text: `Number ${text}`,
                        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                      })));
                      setValidationError('');
                    }}
                    className="p-3 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-[var(--radius-md)] text-center transition-colors border border-[var(--border)]"
                  >
                    <div className="text-lg mb-1">🎲</div>
                    <div className="text-sm font-medium text-[var(--text)]">Numbers 1-6</div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
