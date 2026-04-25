import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'light' | 'dark'; // light for dark backgrounds (white text), dark for light backgrounds (dark text)
}

export default function BrandLogo({ className = "h-10", variant = 'light' }: BrandLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/logo.png" 
        alt="The Big Pixel" 
        className="h-full w-auto object-contain hidden" 
        onLoad={(e) => {
          const target = e.target as HTMLImageElement;
          target.classList.remove('hidden');
          target.classList.add('block');
          if (target.nextElementSibling) {
            target.nextElementSibling.classList.add('hidden');
            target.nextElementSibling.classList.remove('flex');
          }
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.nextElementSibling) {
            target.nextElementSibling.classList.remove('hidden');
            target.nextElementSibling.classList.add('flex');
          }
        }} 
      />
      
      {/* Fallback Logo Typographic Clean */}
      <div className="flex items-center gap-3 h-full w-full">
        <div className="h-full aspect-square bg-tbp-orange rounded-xl flex items-center justify-center text-white shadow-lg shadow-tbp-orange/20 border border-white/10 shrink-0">
          <span className="font-display font-bold text-lg">TBP</span>
        </div>
        <div className={`flex flex-col justify-center ${variant === 'light' ? 'text-white' : 'text-tbp-dark'}`}>
          <div className="font-display text-lg tracking-tight font-black leading-none uppercase">
            The Big Pixel
          </div>
          <div className="text-[9px] opacity-60 tracking-[0.2em] font-mono leading-none mt-1.5 uppercase font-bold">
            Workspace
          </div>
        </div>
      </div>
    </div>
  );
}
