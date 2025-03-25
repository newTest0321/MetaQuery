'use client';
import Link from "next/link";
import { useState, useEffect } from "react";
import "./styles/home.css"; 

export default function Home() {
  const phrases = ["Seamless Insights, One Query Away", "Your Data, Your Way", "See Beyond Tables"];
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [delay, setDelay] = useState(125); // Typing speed

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < phrases[index].length) {
          setText((prev) => prev + phrases[index][charIndex]);
          setCharIndex(charIndex + 1);
        } else {
          setIsDeleting(true);
          setDelay(1000); // Wait 1 seconds before erasing
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

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center text-white text-center px-5 overflow-hidden home-container">
      {/* Background Animation (Unified with Navbar) */}
      <div className="absolute inset-0 animated-bg"></div>

      {/* Navbar with Animated Background */}
      <nav className="fixed top-0 left-0 w-full px-5 py-3 flex justify-between items-center shadow-lg z-10 bg-transparent backdrop-blur-md animated-bg">
        <Link href="/" className="font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent text-2xl tracking-wide">
          MetaQuery
        </Link>
        <div className="flex space-x-4 md:space-x-6 items-center">
          <Link href="/docs" className="hover:underline">Docs</Link>
          <Link href="/about" className="hover:underline">About Us</Link>
          <Link href="/solutions" className="hover:underline">Solutions</Link>
          <Link href="/signup" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-transform transform hover:scale-105">
            Sign Up
          </Link>
          <Link href="/login" className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow-md transition-transform transform hover:scale-105">
            Login
          </Link>
        </div>
      </nav>

      {/* Animated Text */}
      <h1 className="relative z-10 text-3xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent mt-24 md:mt-32 min-h-[80px] drop-shadow-lg">
        {text}
      </h1>

      <p className="relative z-10 mt-4 text-lg text-gray-300 max-w-2xl">
      Unify your data experience - explore, analyze, and query Iceberg, Hudi, and Delta effortlessly in one seamless platform
      </p>

      <Link href="/files" className="relative z-10 mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg shadow-md transition-transform transform hover:scale-110">
        Get Started
      </Link>
    </div>
  );
}
