import React, { useState, useEffect } from 'react';

interface CaseTransitionProps {
  premise: string;
  onComplete: () => void;
}

export default function CaseTransition({ premise, onComplete }: CaseTransitionProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsFinished(false);

    const interval = setInterval(() => {
      if (index < premise.length) {
        setDisplayedText((prev) => prev + premise.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsFinished(true);
      }
    }, 25); // Speed of typewriter character reveal

    const handleKeyDown = () => {
      if (index >= premise.length) {
        handleProceed();
      } else {
        // Skip typewriter animation
        clearInterval(interval);
        setDisplayedText(premise);
        setIsFinished(true);
        index = premise.length;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [premise]);

  const handleProceed = () => {
    setFadeClass('opacity-0 transition-opacity duration-500');
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <div
      onClick={isFinished ? handleProceed : () => {
        setDisplayedText(premise);
        setIsFinished(true);
      }}
      className={`fixed inset-0 bg-[#060606] z-50 flex flex-col justify-center items-center p-6 md:p-12 font-mono select-none cursor-pointer ${fadeClass}`}
    >
      {/* Decorative scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.05]"></div>
      
      <div className="max-w-2xl w-full flex flex-col gap-6">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-[#333] pb-2 text-[10px] text-[#FFB000]/70 uppercase tracking-widest">
          <span>[ INCOMING DATA TRANSMISSION ]</span>
          <span className="animate-pulse">● BUFFERING SIGNAL...</span>
        </div>

        {/* Premise Typewriter Block */}
        <div className="min-h-[160px] text-[#e0e0e0] text-sm leading-relaxed whitespace-pre-wrap select-none tracking-wide">
          {displayedText}
          {!isFinished && <span className="inline-block w-2 h-4 bg-[#FFB000] ml-1 animate-pulse">|</span>}
        </div>

        {/* Actions Indicator */}
        {isFinished ? (
          <div className="mt-8 text-center animate-pulse text-[#FFB000] text-xs font-bold uppercase tracking-[0.2em] border border-[#FFB000]/30 py-3 bg-[#FFB000]/5">
            [ PRESS ANY KEY OR CLICK TO BEGIN INVESTIGATION ]
          </div>
        ) : (
          <div className="text-[9px] text-[#444] text-right uppercase tracking-wider">
            Click to skip narration speed
          </div>
        )}
      </div>
    </div>
  );
}
