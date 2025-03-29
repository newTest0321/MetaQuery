"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      
      // Store token and user data in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      console.log("Login successful:", data);
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl text-white">
            Welcome Back to{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              MetaQuery
            </span>
          </h1>
          <p className="text-sm text-white">
            Sign in to continue your journey
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email" className="text-sm font-medium text-blue-200">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-800/50 border-gray-700 text-blue-100 placeholder:text-blue-300/50 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="password" className="text-sm font-medium text-blue-200">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-800/50 border-gray-700 text-blue-100 placeholder:text-blue-300/50 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm font-medium bg-red-500/10 p-2 rounded-md">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white font-medium">
          Sign In
        </Button>
      </div>

      <div className="text-center text-sm text-blue-200">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
          Create one now
        </a>
      </div>
    </form>
  );
}
