"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formattedEmail = `${phoneNumber}@vidyaprinters.com`;

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: formattedEmail,
      password: password,
    });

    if (error) {
      setError("Invalid Mobile Number or Password.");
      setLoading(false);
    } else if (authData.user) {
      // Check the role of the user
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      // Route them based on their role
      if (profile?.role === "employee" || profile?.role === "admin" || profile?.role === "superadmin") {
        router.push("/dashboard");
      } else {
        router.push("/client/dashboard");
      }
    }
  };

  return (
    <div className="bg-bg-main font-display antialiased text-text-main min-h-screen flex flex-col justify-center items-center overflow-hidden relative selection:bg-primary selection:text-white w-full h-full">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-full h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none translate-y-1/2"></div>
      
      <main className="w-full max-w-md px-6 relative z-10 flex flex-col items-center justify-center min-h-screen">
        
        {/* Logo / Header Section */}
        <div className="flex flex-col items-center mb-10 w-full animate-in slide-in-from-top-4 duration-500">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-6">
            <span className="material-symbols-outlined text-white text-3xl">print</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-center text-text-main mb-2">Vidya Printers</h1>
          <p className="text-text-sub text-sm font-bold uppercase tracking-widest">Enterprise ERP Portal</p>
        </div>

        {/* Login Form Card */}
        <div className="w-full bg-surface/60 backdrop-blur-xl border border-border-subtle rounded-3xl shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-semibold text-center border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            {/* Mobile Number Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-text-main ml-1">
                Mobile Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-text-sub group-focus-within:text-primary transition-colors">smartphone</span>
                </div>
                <input 
                  type="text" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-bg-main border border-border-subtle rounded-2xl text-text-main placeholder-text-sub focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-medium" 
                  placeholder="Enter registered mobile" 
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1 pr-1">
                <label className="block text-sm font-bold text-text-main">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-text-sub group-focus-within:text-primary transition-colors">lock</span>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-bg-main border border-border-subtle rounded-2xl text-text-main placeholder-text-sub focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-medium" 
                  placeholder="••••••••" 
                  required
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-primary/30 text-sm font-black text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform active:scale-95 disabled:bg-gray-400 disabled:shadow-none"
              >
                <span className="material-symbols-outlined mr-2 text-[20px]">{loading ? 'hourglass_empty' : 'verified_user'}</span>
                {loading ? "Authenticating..." : "Secure Login"}
              </button>
            </div>
          </form>
          
          <div className="mt-8 flex justify-center">
            <p className="text-xs font-semibold text-text-sub">System protected by UT Arts Security</p>
          </div>
        </div>
      </main>
    </div>
  );
}