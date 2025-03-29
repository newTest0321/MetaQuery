"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { SignupForm } from "@/components/signup-form";
import { useEffect, useRef } from "react";
import CustomCursor from "@/components/CustomCursor";

function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let cards = [];

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Neon Card class
    class NeonCard {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.width = Math.random() * 200 + 150;
        this.height = Math.random() * 200 + 150;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = (Math.random() - 0.5) * 0.2;
        this.color = `hsl(${Math.random() * 60 + 200}, 100%, 50%)`;
        this.alpha = Math.random() * 0.15 + 0.05;
        this.cornerRadius = 20;
        this.targetRotation = Math.random() * Math.PI * 2;
        this.rotationChangeInterval = Math.random() * 100 + 50;
        this.rotationChangeCounter = 0;
        this.repulsionRadius = 300;
        this.repulsionStrength = 0.5;
      }

      update() {
        // Update position with smooth movement
        this.x += this.speedX;
        this.y += this.speedY;

        // Apply repulsion forces from other cards
        cards.forEach(otherCard => {
          if (otherCard === this) return;

          const dx = this.x - otherCard.x;
          const dy = this.y - otherCard.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < this.repulsionRadius) {
            // Calculate repulsion force
            const force = (this.repulsionRadius - distance) / this.repulsionRadius;
            const angle = Math.atan2(dy, dx);
            
            // Apply repulsion
            this.speedX += Math.cos(angle) * force * this.repulsionStrength;
            this.speedY += Math.sin(angle) * force * this.repulsionStrength;
            
            // Limit maximum speed
            const maxSpeed = 0.5;
            const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
            if (currentSpeed > maxSpeed) {
              this.speedX = (this.speedX / currentSpeed) * maxSpeed;
              this.speedY = (this.speedY / currentSpeed) * maxSpeed;
            }
          }
        });

        // Update rotation with smooth transitions
        this.rotationChangeCounter++;
        if (this.rotationChangeCounter >= this.rotationChangeInterval) {
          this.targetRotation = Math.random() * Math.PI * 2;
          this.rotationChangeCounter = 0;
        }

        // Smoothly interpolate to target rotation
        const rotationDiff = this.targetRotation - this.rotation;
        this.rotation += rotationDiff * 0.02;

        // Wrap around screen edges
        if (this.x + this.width < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = -this.width;
        if (this.y + this.height < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = -this.height;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));

        // Draw card with rounded corners
        ctx.beginPath();
        ctx.moveTo(this.x + this.cornerRadius, this.y);
        ctx.lineTo(this.x + this.width - this.cornerRadius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + this.cornerRadius);
        ctx.lineTo(this.x + this.width, this.y + this.height - this.cornerRadius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - this.cornerRadius, this.y + this.height);
        ctx.lineTo(this.x + this.cornerRadius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - this.cornerRadius);
        ctx.lineTo(this.x, this.y + this.cornerRadius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + this.cornerRadius, this.y);
        ctx.closePath();

        // Add neon glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 40;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = this.alpha;
        ctx.stroke();

        // Add subtle fill
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha * 0.1;
        ctx.fill();

        ctx.restore();
      }
    }

    // Initialize cards
    for (let i = 0; i < 40; i++) {
      cards.push(new NeonCard());
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(17, 24, 39, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw cards
      cards.forEach(card => {
        card.update();
        card.draw();
      });

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
      className="fixed inset-0 w-full h-full -z-10"
      style={{
        background: 'linear-gradient(to bottom right, #111827, #1F2937)',
        opacity: 0.8
      }}
    />
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
       <CustomCursor />
      <AnimatedBackground />
      <CustomCursor />
      
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="grid w-full h-full lg:grid-cols-2 shadow-lg bg-gray-900/30 backdrop-blur-xl rounded-xl border border-white/10">
          
          {/* Left Section */}
          <div className="flex flex-col gap-6 px-6 md:px-10 py-8">
            
            {/* MetaQuery Branding */}
            <div className="flex justify-center md:justify-start gap-2">
              <a href="/" className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                <div className="bg-primary/80 text-primary-foreground flex size-6 items-center justify-center rounded-md backdrop-blur-sm">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                MetaQuery
              </a>
            </div>

            {/* Signup Form */}
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-xs">
                <SignupForm />
              </div>
            </div>
          </div>

          {/* Right Section - Welcome Text */}
          <div className="hidden lg:flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-4xl font-bold mb-4 text-center">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                MetaQuery
              </span>
            </h1>
            <p className="text-xl text-center text-gray-300">
              Your intelligent data lake management platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
