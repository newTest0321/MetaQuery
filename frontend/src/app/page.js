"use client";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import "../styles/home.css";
import { Button } from "@/components/ui/button";

export default function Home() {
  const phrases = [
    "Seamless Insights, One Query Away",
    "Your Data, Your Way",
    "See Beyond Tables",
  ];
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [delay, setDelay] = useState(125); // Typing speed

  // Cursor refs for smooth animation
  const dotRef = useRef(null);
  const outlineRef = useRef(null);
  const mousePosition = useRef({ x: -100, y: -100 });
  const isHoveringRef = useRef(false);
  const rafRef = useRef(null);

  // Add new ref for tracking image transform state
  const isImageTransformRef = useRef(false);
  
  // Enhanced cursor animation with image transform support
  const animateCursor = useCallback(() => {
    if (!dotRef.current || !outlineRef.current) return;

    // Don't animate position when in image transform mode
    if (!isImageTransformRef.current) {
      dotRef.current.style.left = `${mousePosition.current.x}px`;
      dotRef.current.style.top = `${mousePosition.current.y}px`;

      const rect = outlineRef.current.getBoundingClientRect();
      const outlineX = rect.left + rect.width / 2;
      const outlineY = rect.top + rect.height / 2;
      
      const dx = mousePosition.current.x - outlineX;
      const dy = mousePosition.current.y - outlineY;
      
      // Increased easing factor from 0.2 to 0.4 for faster following
      const newX = outlineX + dx * 0.4;
      const newY = outlineY + dy * 0.4;
      
      outlineRef.current.style.left = `${newX}px`;
      outlineRef.current.style.top = `${newY}px`;
    }

    rafRef.current = requestAnimationFrame(animateCursor);
  }, []);

  // Handle mouse movement
  const handleMouseMove = useCallback((e) => {
    mousePosition.current = { x: e.clientX, y: e.clientY };
  }, []);

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

  // Handle image area hover
  const handleImageHover = useCallback((e, imageUrl) => {
    if (!outlineRef.current || !dotRef.current) return;
    
    isImageTransformRef.current = true;
    
    // Update cursor position first
    const x = e.clientX;
    const y = e.clientY;
    
    outlineRef.current.style.left = `${x}px`;
    outlineRef.current.style.top = `${y}px`;
    
    // Add transform classes
    outlineRef.current.classList.add('cursor-image-transform');
    outlineRef.current.style.backgroundImage = `url(${imageUrl})`;
    dotRef.current.classList.add('cursor-image-transform');
    
    // Add active class in next frame for smooth transition
    requestAnimationFrame(() => {
      if (outlineRef.current) {
        outlineRef.current.classList.add('active');
      }
    });
  }, []);

  // Handle image area leave
  const handleImageLeave = useCallback(() => {
    if (!outlineRef.current || !dotRef.current) return;
    
    // Remove active class first
    outlineRef.current.classList.remove('active');
    
    // Remove other classes after transition
    setTimeout(() => {
      isImageTransformRef.current = false;
      if (outlineRef.current) {
        outlineRef.current.classList.remove('cursor-image-transform');
        outlineRef.current.style.backgroundImage = '';
      }
      if (dotRef.current) {
        dotRef.current.classList.remove('cursor-image-transform');
      }
    }, 500);
  }, []);

  // Update useEffect to properly handle image list items
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animateCursor);
    
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    const interactiveElements = document.querySelectorAll('a, button, [role="button"]');
    const imageListItems = document.querySelectorAll('.image-list-item');
    
    // Store event handlers for cleanup
    const eventHandlers = new Map();
    
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnter, { passive: true });
      element.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    });

    // Update event listeners for image list items
    imageListItems.forEach(item => {
      const imageUrl = item.dataset.image;
      
      const handleItemMouseMove = (e) => {
        if (!isImageTransformRef.current) {
          handleImageHover(e, imageUrl);
        } else {
          // Update position while hovering
          const x = e.clientX;
          const y = e.clientY;
          if (outlineRef.current) {
            outlineRef.current.style.left = `${x}px`;
            outlineRef.current.style.top = `${y}px`;
          }
        }
      };

      // Store the handler for cleanup
      eventHandlers.set(item, {
        mouseenter: handleItemMouseMove,
        mousemove: handleItemMouseMove,
        mouseleave: handleImageLeave
      });

      // Add event listeners
      item.addEventListener('mouseenter', handleItemMouseMove, { passive: true });
      item.addEventListener('mousemove', handleItemMouseMove, { passive: true });
      item.addEventListener('mouseleave', handleImageLeave, { passive: true });
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      
      // Cleanup interactive elements
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });

      // Cleanup image list items using stored handlers
      imageListItems.forEach(item => {
        const handlers = eventHandlers.get(item);
        if (handlers) {
          item.removeEventListener('mouseenter', handlers.mouseenter);
          item.removeEventListener('mousemove', handlers.mousemove);
          item.removeEventListener('mouseleave', handlers.mouseleave);
        }
      });
    };
  }, [animateCursor, handleMouseMove, handleMouseEnter, handleMouseLeave, handleImageHover, handleImageLeave]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < phrases[index].length) {
          setText((prev) => prev + phrases[index][charIndex]);
          setCharIndex(charIndex + 1);
        } else {
          setIsDeleting(true);
          setDelay(1000); // Wait 1 second before erasing
        }
      } else {
        setDelay(50); // Speed up deleting
        if (charIndex > 0) {
          setText((prev) => prev.slice(0, -1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setDelay(125); // Reset to normal typing speed
          setIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        }
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, index, delay]);

  // Initialize particles.js
  useEffect(() => {
    const loadParticles = async () => {
      if (typeof window !== "undefined") {
        try {
        const particlesJS = await import("particles.js");
        if (window.particlesJS) {
            window.particlesJS.load("particles-js", "/particles.json", () => {
            console.log("Particles.js config loaded");
          });
          }
        } catch (error) {
          console.error("Error loading particles.js:", error);
        }
      }
    };

    loadParticles();
  }, []);

  const logoSectionRef = useRef(null);
  const [isLogoSectionVisible, setIsLogoSectionVisible] = useState(false);

  // Add scroll visibility detection
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.3
    };

    const handleIntersect = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isLogoSectionVisible) {
          setIsLogoSectionVisible(true);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    
    if (logoSectionRef.current) {
      observer.observe(logoSectionRef.current);
    }

    return () => observer.disconnect();
  }, [isLogoSectionVisible]);

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Custom Cursor */}
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

      {/* Fixed Background Elements */}
      <div className="fixed-bg-container">
      <div className="absolute inset-0 animated-bg"></div>
        <div id="particles-js" className="absolute inset-0 w-full h-full"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full px-5 py-3 flex justify-between items-center shadow-lg z-10 bg-transparent backdrop-blur-md animated-bg">
        <Link
          href="/"
          className="font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent text-2xl tracking-wide"
        >
          MetaQuery
        </Link>
        <div className="flex space-x-4 md:space-x-6 items-center">
          <Link href="/docs" className="hover:underline">
            Docs
          </Link>
          <Link href="/about" className="hover:underline">
            About Us
          </Link>
          <Link href="/solutions" className="hover:underline">
            Solutions
          </Link>
          <Button asChild>
            <Link href="/signup">Signup</Link>
          </Button>
          <Link
            href="/login"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow-md transition-transform transform hover:scale-105"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content flex flex-col">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="interactive-content">
              <h1 className="text-3xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent min-h-[80px] drop-shadow-lg text-content">
                {text}
              </h1>

              <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto text-content">
                Unify your data experience - explore, analyze, and query Iceberg, Hudi,
                and Delta effortlessly in one seamless platform.
              </p>

              <div className="hero-button">
                <Link
                  href="/signup"
                  className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-semibold shadow-md transition-all transform hover:scale-110 hover:shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Content Sections */}
        <section className="min-h-screen py-20 px-5 blur-section">
          <div className="max-w-6xl mx-auto content-section p-8 rounded-xl">
            <div className="interactive-content">
              <h2 className="text-4xl font-bold text-white mb-8 text-center text-content">Why Choose MetaQuery?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-white mb-4 text-content">Unified Experience</h3>
                  <p className="text-gray-300 text-content">Access all your data sources through a single, intuitive interface.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-white mb-4 text-content">Powerful Analytics</h3>
                  <p className="text-gray-300 text-content">Advanced querying capabilities across multiple data formats.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-white mb-4 text-content">Seamless Integration</h3>
                  <p className="text-gray-300 text-content">Works with your existing data infrastructure without disruption.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Lake Formats Section */}
        <section className="image-list-section blur-section">
          <div className="image-list-container">
            <h2 className="text-4xl font-bold text-white mb-12 text-center text-content">Supported Data Lake Formats</h2>
            
            <div className="image-list">
              <div 
                className="image-list-item"
                data-image="/images/Apache_hudi.png"
              >
                <div className="image-list-content">
                  <h3 className="image-list-title">Apache Hudi</h3>
                  <p className="image-list-description">
                    Manage your data lake with atomic updates, record-level versioning, and efficient upserts using Apache Hudi's powerful capabilities.
                  </p>
                </div>
              </div>

              <div 
                className="image-list-item"
                data-image="/images/apache-iceberg.jpg"
              >
                <div className="image-list-content">
                  <h3 className="image-list-title">Apache Iceberg</h3>
                  <p className="image-list-description">
                    Experience high-performance querying and schema evolution with Apache Iceberg's modern table format designed for massive datasets.
                  </p>
                </div>
              </div>

              <div 
                className="image-list-item"
                data-image="/images/Delta_table.png"
              >
                <div className="image-list-content">
                  <h3 className="image-list-title">Delta Lake</h3>
                  <p className="image-list-description">
                    Build reliable data lakes with ACID transactions, scalable metadata handling, and time travel capabilities using Delta Lake.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cloud Partners Logo Scroll */}
        <section ref={logoSectionRef} className="logo-scroll-section py-12 blur-section">
          <div className="logo-scroll-container">
            <h2 className={`logo-scroll-heading ${isLogoSectionVisible ? 'visible' : ''}`}>
              Supported Cloud Platforms
            </h2>
            <div className={`logo-scroll-track ${isLogoSectionVisible ? 'visible' : ''}`}>
              {/* First set of logos */}
              <div className="logo-scroll-content">
                <div className="logo-item">
                  <img src="/cloud-logos/aws.png" alt="Amazon Web Services" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/azure.png" alt="Microsoft Azure" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/gcp.png" alt="Google Cloud Platform" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/ibm.png" alt="IBM Cloud" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/oracle.png" alt="Oracle Cloud" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/digitalocean.png" alt="Digital Ocean" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/linode.png" alt="Linode" />
                </div>
              </div>
              {/* Duplicate set for seamless loop */}
              <div className="logo-scroll-content">
                <div className="logo-item">
                  <img src="/cloud-logos/aws.png" alt="Amazon Web Services" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/azure.png" alt="Microsoft Azure" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/gcp.png" alt="Google Cloud Platform" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/ibm.png" alt="IBM Cloud" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/oracle.png" alt="Oracle Cloud" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/digitalocean.png" alt="Digital Ocean" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/linode.png" alt="Linode" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
