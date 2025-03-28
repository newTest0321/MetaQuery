"use client";
import { useEffect, useCallback, useRef, useState } from "react";

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const dotRef = useRef(null);
  const outlineRef = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const isHoveringRef = useRef(false);
  const rafRef = useRef(null);

  // Enhanced cursor animation
  const animateCursor = useCallback(() => {
    if (!dotRef.current || !outlineRef.current) return;

    const { x, y } = mousePosition.current;
    
    dotRef.current.style.left = `${x}px`;
    dotRef.current.style.top = `${y}px`;

    const rect = outlineRef.current.getBoundingClientRect();
    const outlineX = rect.left + rect.width / 2;
    const outlineY = rect.top + rect.height / 2;
    
    const dx = x - outlineX;
    const dy = y - outlineY;
    
    const newX = outlineX + dx * 0.4;
    const newY = outlineY + dy * 0.4;
    
    outlineRef.current.style.left = `${newX}px`;
    outlineRef.current.style.top = `${newY}px`;

    rafRef.current = requestAnimationFrame(animateCursor);
  }, []);

  // Handle mouse movement
  const handleMouseMove = useCallback((e) => {
    mousePosition.current = { x: e.clientX, y: e.clientY };
    if (!isVisible) setIsVisible(true);
  }, [isVisible]);

  // Handle hover states
  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
    if (outlineRef.current) {
      outlineRef.current.classList.add('cursor-hover');
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
    if (outlineRef.current) {
      outlineRef.current.classList.remove('cursor-hover');
    }
  }, []);

  // Initialize cursor
  useEffect(() => {
    // Add custom-cursor class to body
    document.body.classList.add('custom-cursor');

    // Set initial position
    if (dotRef.current && outlineRef.current) {
      const { x, y } = mousePosition.current;
      dotRef.current.style.left = `${x}px`;
      dotRef.current.style.top = `${y}px`;
      outlineRef.current.style.left = `${x}px`;
      outlineRef.current.style.top = `${y}px`;
    }

    rafRef.current = requestAnimationFrame(animateCursor);
    
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, textarea');
    
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnter, { passive: true });
      element.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    });

    return () => {
      // Remove custom-cursor class from body
      document.body.classList.remove('custom-cursor');
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [animateCursor, handleMouseMove, handleMouseEnter, handleMouseLeave]);

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{ transform: 'translate(-50%, -50%)' }}
      />
      <div
        ref={outlineRef}
        className="cursor-outline"
        style={{ transform: 'translate(-50%, -50%)' }}
      />
    </>
  );
} 