"use client";

import React, { useEffect, useRef, useState } from 'react';

interface MagicBentoProps {
  children?: React.ReactNode;
  className?: string;
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  glowColor?: string;
}

export default function MagicBento({
  children,
  className = "",
  textAutoHide = false,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = true,
  spotlightRadius = 300,
  particleCount = 12,
  glowColor = "132, 0, 255"
}: MagicBentoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    if (enableSpotlight || enableTilt || enableMagnetism) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', () => setIsHovered(true));
      container.addEventListener('mouseleave', () => setIsHovered(false));
    }

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', () => setIsHovered(true));
      container.removeEventListener('mouseleave', () => setIsHovered(false));
    };
  }, [enableSpotlight, enableTilt, enableMagnetism]);

  const spotlightStyle = enableSpotlight && isHovered ? {
    background: `radial-gradient(${spotlightRadius}px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(${glowColor}, 0.15), transparent 40%)`
  } : {};

  return (
    <div
      ref={containerRef}
      className={`magic-bento-container relative overflow-hidden rounded-xl ${className}`}
      style={{
        transition: 'transform 0.3s ease',
        ...spotlightStyle
      }}
    >
      {/* Stars Background */}
      {enableStars && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(particleCount)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Border Glow */}
      {enableBorderGlow && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `linear-gradient(90deg, rgba(${glowColor}, 0.5), transparent)`,
            opacity: isHovered ? 0.6 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Content */}
      <div className={`relative z-10 ${textAutoHide && !isHovered ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        {children}
      </div>
    </div>
  );
}