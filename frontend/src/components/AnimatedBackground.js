"use client";

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let lines = [];

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.color = `hsl(${Math.random() * 60 + 200}, 100%, 50%)`; // Blue to purple range
        this.alpha = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
      }
    }

    // Line class
    class Line {
      constructor() {
        this.x1 = Math.random() * canvas.width;
        this.y1 = Math.random() * canvas.height;
        this.x2 = Math.random() * canvas.width;
        this.y2 = Math.random() * canvas.height;
        this.color = `hsl(${Math.random() * 60 + 200}, 100%, 50%)`;
        this.alpha = Math.random() * 0.3 + 0.1;
        this.speed = Math.random() * 0.5 + 0.2;
        this.angle = Math.random() * Math.PI * 2;
      }

      update() {
        this.angle += this.speed;
        this.x1 += Math.cos(this.angle) * 0.5;
        this.y1 += Math.sin(this.angle) * 0.5;
        this.x2 += Math.cos(this.angle + Math.PI) * 0.5;
        this.y2 += Math.sin(this.angle + Math.PI) * 0.5;

        // Reset position if line goes off screen
        if (this.x1 < 0 || this.x1 > canvas.width || this.y1 < 0 || this.y1 > canvas.height) {
          this.x1 = Math.random() * canvas.width;
          this.y1 = Math.random() * canvas.height;
        }
        if (this.x2 < 0 || this.x2 > canvas.width || this.y2 < 0 || this.y2 > canvas.height) {
          this.x2 = Math.random() * canvas.width;
          this.y2 = Math.random() * canvas.height;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Initialize particles and lines
    for (let i = 0; i < 50; i++) {
      particles.push(new Particle());
    }
    for (let i = 0; i < 20; i++) {
      lines.push(new Line());
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(17, 24, 39, 0.1)'; // Dark background with slight transparency
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Update and draw lines
      lines.forEach(line => {
        line.update();
        line.draw();
      });

      // Add neon glow effect
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)'; // Blue glow
      ctx.shadowBlur = 15;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0"
      style={{
        background: 'linear-gradient(to bottom right, #111827, #1F2937)',
        opacity: 0.8
      }}
    />
  );
} 