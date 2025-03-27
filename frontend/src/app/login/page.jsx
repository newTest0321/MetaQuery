"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="static-bg text-white w-screen h-screen flex items-center justify-center">
      <div className="grid w-full h-full lg:grid-cols-2 shadow-lg bg-opacity-90 bg-gray-900 backdrop-blur-md">
        
        {/* Right Section - Full Height Background Image */}
        <div className="relative hidden lg:block">
          <img
            src="/file.svg"
            alt="Image"
            className="absolute inset-0 w-full h-full object-cover brightness-75"
          />
        </div>

        {/* Left Section */}
        <div className="flex flex-col gap-6 px-6 md:px-10 py-8">
          
          {/* MetaQuery Branding */}
          <div className="flex justify-center md:justify-start gap-2">
            <a href="/" className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              MetaQuery
            </a>
          </div>

          {/* Login Form */}
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
