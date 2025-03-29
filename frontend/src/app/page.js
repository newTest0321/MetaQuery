"use client";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import "../styles/home.css";
import { Button } from "@/components/ui/button";
import VideoModal from "@/components/VideoModal";
import { FiHelpCircle, FiHeadphones, FiMoreHorizontal, FiPlus, FiMinus } from 'react-icons/fi';

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

  // Add new handler for tutorial section
  const handleTutorialHover = useCallback((e) => {
    if (!outlineRef.current || !dotRef.current) return;
    
    isImageTransformRef.current = true;
    
    const x = e.clientX;
    const y = e.clientY;
    
    // Smooth position update
    const updatePosition = () => {
      if (!outlineRef.current || !dotRef.current) return;
      
      outlineRef.current.style.left = `${x}px`;
      outlineRef.current.style.top = `${y}px`;
      dotRef.current.style.left = `${x}px`;
      dotRef.current.style.top = `${y}px`;
    };
    
    // Add transform classes with RAF for smooth transition
    requestAnimationFrame(() => {
      updatePosition();
      outlineRef.current.classList.add('eye-transform');
      dotRef.current.classList.add('eye-transform');
      
      // Add active class in next frame for smooth transition
      requestAnimationFrame(() => {
        if (outlineRef.current) {
          outlineRef.current.classList.add('active');
        }
      });
    });
  }, []);

  const handleTutorialLeave = useCallback(() => {
    if (!outlineRef.current || !dotRef.current) return;
    
    // Remove active class first
    outlineRef.current.classList.remove('active');
    
    // Remove transform classes after transition
    setTimeout(() => {
      isImageTransformRef.current = false;
      if (outlineRef.current) {
        outlineRef.current.classList.remove('eye-transform');
      }
      if (dotRef.current) {
        dotRef.current.classList.remove('eye-transform');
      }
    }, 400); // Match the transition duration from CSS
  }, []);

  // Update useEffect to include tutorial section handlers
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animateCursor);
    
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    const interactiveElements = document.querySelectorAll('a, button, [role="button"]');
    const imageListItems = document.querySelectorAll('.image-list-item');
    const tutorialSection = document.querySelector('.tutorial-cursor-area');
    
    // Store event handlers for cleanup
    const eventHandlers = new Map();
    
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnter, { passive: true });
      element.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    });

    // Add tutorial section handlers
    if (tutorialSection) {
      tutorialSection.addEventListener('mousemove', handleTutorialHover, { passive: true });
      tutorialSection.addEventListener('mouseleave', handleTutorialLeave, { passive: true });
    }

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
      
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });

      if (tutorialSection) {
        tutorialSection.removeEventListener('mousemove', handleTutorialHover);
        tutorialSection.removeEventListener('mouseleave', handleTutorialLeave);
      }

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
  }, [animateCursor, handleMouseMove, handleMouseEnter, handleMouseLeave, handleImageHover, handleImageLeave, handleTutorialHover, handleTutorialLeave]);

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

  const [videoModal, setVideoModal] = useState({
    isOpen: false,
    videoSrc: "",
    title: ""
  });

  const handleOpenVideo = (videoSrc, title) => {
    setVideoModal({
      isOpen: true,
      videoSrc,
      title
    });
  };

  const handleCloseVideo = () => {
    setVideoModal({
      isOpen: false,
      videoSrc: "",
      title: ""
    });
  };

  // Add this state near the other state declarations at the top
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  // Add this function near the other handlers
  const handleVideoClick = (videoSrc, posterSrc) => {
    setActiveVideo({ src: videoSrc, poster: posterSrc });
    setIsVideoPopupOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseVideoPopup = () => {
    setIsVideoPopupOpen(false);
    setActiveVideo(null);
    document.body.style.overflow = 'auto';
  };

  // Add this useEffect near the other useEffect hooks
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isVideoPopupOpen) {
        handleCloseVideoPopup();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isVideoPopupOpen]);

  const faqCategories = [
    { id: 'general', label: 'General', icon: FiHelpCircle },
    { id: 'support', label: 'Support', icon: FiHeadphones },
    { id: 'others', label: 'Others', icon: FiMoreHorizontal }
  ];

  const faqData = {
    general: [
      {
        question: 'How to create an account?',
        answer: 'Creating an account is simple. Click on the "Sign Up" button in the top right corner, fill in your details, and follow the verification process. You\'ll be up and running in minutes.'
      },
      {
        question: 'What features are included in the free plan?',
        answer: 'Our free plan includes basic data exploration, limited queries per day, and access to public datasets. For advanced features like custom integrations and unlimited queries, check out our premium plans.'
      }
    ],
    support: [
      {
        question: 'How can I reset my password?',
        answer: 'To reset your password, click on the "Forgot Password" link on the login page. Enter your email address, and we\'ll send you instructions to create a new password.'
      },
      {
        question: 'What is the payment process?',
        answer: 'We accept all major credit cards and PayPal. Payments are processed securely through Stripe. You can choose monthly or annual billing, with annual plans offering a 20% discount.'
      }
    ],
    others: [
      {
        question: 'Can I export my query results?',
        answer: 'Yes, you can export query results in multiple formats including CSV, JSON, and Excel. Premium users also have access to automated exports and API integration.'
      },
      {
        question: 'Is there a limit on database size?',
        answer: 'Free plans have a 5GB limit. Premium plans start at 100GB and can be customized based on your needs. Contact our sales team for enterprise solutions.'
      }
    ]
  };

  const [activeCategory, setActiveCategory] = useState('general');
  const [activeFaq, setActiveFaq] = useState(null);

  const handleFaqClick = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Video Modal */}
      <VideoModal 
        isOpen={videoModal.isOpen}
        onClose={handleCloseVideo}
        videoSrc={videoModal.videoSrc}
        title={videoModal.title}
      />

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

        {/* Logo Scroll Section */}
        <section ref={logoSectionRef} className="logo-scroll-section">
          <div className="logo-scroll-container">
            <h2 className={`logo-scroll-heading ${isLogoSectionVisible ? 'visible' : ''}`}>
              Supports multiple Cloud Providers
            </h2>
            <div className={`logo-scroll-track ${isLogoSectionVisible ? 'visible' : ''}`}>
              <div className="logo-scroll-content">
                {/* First set of logos */}
                <div className="logo-item">
                  <img src="/cloud-logos/aws.png" alt="AWS" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/azure.png" alt="Azure" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/gcp.png" alt="Google Cloud" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/ibm.png" alt="IBM Cloud" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/digitalocean.png" alt="DigitalOcean" />
                </div>
                {/* Duplicate set for seamless scrolling */}
                <div className="logo-item">
                  <img src="/cloud-logos/aws.png" alt="AWS" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/azure.png" alt="Azure" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/gcp.png" alt="Google Cloud" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/ibm.png" alt="IBM Cloud" />
                </div>
                <div className="logo-item">
                  <img src="/cloud-logos/digitalocean.png" alt="DigitalOcean" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Netflix-style Section - Mobile */}
        <section className="netflix-section">
          <div className="netflix-container">
            <div className="netflix-image" onClick={() => handleVideoClick("/videos/getting-started.mp4", "/mobile.png")}>
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-auto rounded-lg"
                poster="/mobile.png"
              >
                <source src="/videos/getting-started.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="netflix-text">
              <h2 className="netflix-title">Uncover Metadata</h2>
              <p className="netflix-subtitle">Dive into your S3 bucket and reveal hidden insights.
              Navigate effortlessly.</p>
              <Link href="/dashboard" className="netflix-button">
                Start Exploring 
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Netflix-style Section - TV */}
        <section className="netflix-section">
          <div className="netflix-container">
            <div className="netflix-text">
              <h2 className="netflix-title">Spot the Differences</h2>
              <p className="netflix-subtitle">Compare metadata files like a pro.
              Track changes with precision.</p>
              <Link href="/dashboard" className="netflix-button">
                Compare Now
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="netflix-image" onClick={() => handleVideoClick("/videos/getting-started.mp4", "/tv.png")}>
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-auto rounded-lg"
                poster="/tv.png"
              >
                <source src="/videos/getting-started.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        {/* Netflix-style Section - Devices */}
        <section className="netflix-section">
          <div className="netflix-container">
            <div className="netflix-image" onClick={() => handleVideoClick("/videos/getting-started.mp4", "/devices.png")}>
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-auto rounded-lg"
                poster="/devices.png"
              >
                <source src="/videos/getting-started.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="netflix-text">
              <h2 className="netflix-title">Extract & Share</h2>
              <p className="netflix-subtitle">Export metadata in a snap.
              Collaborate without limits.</p>
              <Link href="/dashboard" className="netflix-button">
                Get Started 
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="faq-container">
            <div className="faq-header">
              <span className="faq-label">FAQ</span>
              <h2 className="faq-title">Frequently Asked Questions</h2>
            </div>
            
            <div className="faq-content">
              <div className="faq-categories">
                {faqCategories.map(category => (
                  <button
                    key={category.id}
                    className={`faq-category-btn ${activeCategory === category.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <category.icon className="category-icon" />
                    {category.label}
                  </button>
                ))}
              </div>
              
              <div className="faq-questions">
                {faqData[activeCategory].map((faq, index) => (
                  <div key={index} className="faq-item">
                    <div
                      className={`faq-question ${activeFaq === index ? 'active' : ''}`}
                      onClick={() => handleFaqClick(index)}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-toggle">
                        {activeFaq === index ? <FiMinus /> : <FiPlus />}
                      </span>
                    </div>
                    <div className={`faq-answer ${activeFaq === index ? 'active' : ''}`}>
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Video Popup Modal */}
      <div 
        className={`video-popup-overlay ${isVideoPopupOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseVideoPopup();
          }
        }}
      >
        <div className="video-popup-content">
          <div className="video-popup-close" onClick={handleCloseVideoPopup}>
            ×
          </div>
          {activeVideo && (
            <video
              className="video-popup-video"
              controls
              autoPlay
              poster={activeVideo.poster}
              src={activeVideo.src}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </div>
    </div>
  );
}