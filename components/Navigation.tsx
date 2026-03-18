"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";

export default function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isFabOpen, setIsFabOpen] = useState(false);

// Hide Admin nav on login or if the user is in the client portal
if (pathname === "/login" || pathname.startsWith("/client")) return null;
  // Hide bottom nav on specific hub pages to give full screen to the chat
  const isHubPage = pathname.split('/').length > 2 && (pathname.startsWith('/customers/') || pathname.startsWith('/orders/'));

  // Split items to wrap around the center FAB
  const leftItems = [
    { name: "Home", href: "/dashboard", icon: "dashboard" },
    { name: "Orders", href: "/orders", icon: "receipt_long" },
    { name: "Stock", href: "/inventory", icon: "inventory_2" },
  ];
  const rightItems = [
    { name: "Clients", href: "/customers", icon: "group" },
    { name: "Services", href: "/services", icon: "sell" },
    { name: "Staff", href: "/employees", icon: "badge" },
  ];

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border-subtle shrink-0 sticky top-0 h-screen z-50">
        <div className="p-6 pb-6 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tight">VIDYA</h1>
            <p className="text-[10px] font-bold text-text-sub uppercase tracking-widest mt-0.5">Enterprise ERP</p>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-bg-main text-text-sub hover:text-primary transition-colors">
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>

        {/* Desktop Quick Add Button */}
        <div className="px-4 py-4">
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isFabOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>add</span>
            Quick Action
          </button>
          
          {/* Desktop Dropdown Menu */}
          {isFabOpen && (
            <div className="mt-2 bg-surface border border-border-subtle rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-top-2">
              <Link href="/orders/new" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-main transition-colors text-sm font-semibold text-text-main">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span> New Order
              </Link>
              <Link href="/customers" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-main transition-colors text-sm font-semibold text-text-main border-t border-border-subtle">
                <span className="material-symbols-outlined text-emerald-500 text-[20px]">payments</span> Receive Payment
              </Link>
              <Link href="/customers" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-main transition-colors text-sm font-semibold text-text-main border-t border-border-subtle">
                <span className="material-symbols-outlined text-purple-500 text-[20px]">person_add</span> Add Customer
              </Link>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {[...leftItems, ...rightItems].map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive ? "bg-primary/10 text-primary font-bold" : "text-text-sub hover:bg-bg-main hover:text-text-main"}`}>
                <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className={`${isHubPage ? 'hidden' : 'md:hidden'} fixed bottom-0 w-full z-[100] pointer-events-none`}>
        {/* The actual navbar block with rounded top corners */}
        <div className="pointer-events-auto bg-surface/95 backdrop-blur-xl border-t border-border-subtle rounded-t-3xl pb-2.5 pt-2 px-1 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] relative">
          
          {/* Radial Quick Action Menu (Semicircle) */}
          <div className={`absolute bottom-26 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none ${isFabOpen ? 'opacity-100' : 'opacity-0 scale-50'}`}>
            <div className="relative w-full h-full pointer-events-auto">
               {/* Left Button */}
               <Link href="/orders/new" onClick={() => setIsFabOpen(false)} className={`absolute flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 shadow-lg border border-blue-200 transition-all duration-300 ${isFabOpen ? 'translate-x-[-80px] translate-y-[-10px]' : 'translate-x-0 translate-y-0'}`}>
                 <span className="material-symbols-outlined">receipt_long</span>
               </Link>
               {/* Top Center Button */}
               <Link href="/customers" onClick={() => setIsFabOpen(false)} className={`absolute flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 shadow-lg border border-emerald-200 transition-all duration-300 ${isFabOpen ? 'translate-x-[-24px] translate-y-[-65px]' : 'translate-x-0 translate-y-0'}`}>
                 <span className="material-symbols-outlined">payments</span>
               </Link>
               {/* Right Button */}
               <Link href="/customers" onClick={() => setIsFabOpen(false)} className={`absolute flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-600 shadow-lg border border-purple-200 transition-all duration-300 ${isFabOpen ? 'translate-x-[32px] translate-y-[-10px]' : 'translate-x-0 translate-y-0'}`}>
                 <span className="material-symbols-outlined">person_add</span>
               </Link>
            </div>
          </div>

          <div className="flex justify-between items-end h-14 pb-2 relative">
            {/* Left Items */}
            <div className="flex w-2/5 justify-between px-1">
              {leftItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link key={item.name} href={item.href} className="flex flex-col items-center justify-end gap-1 group w-12">
                    <span className={`material-symbols-outlined text-[22px] transition-colors ${isActive ? 'text-primary filled' : 'text-text-sub group-hover:text-primary'}`}>{item.icon}</span>
                    <span className={`text-[9px] font-medium tracking-wide ${isActive ? 'text-primary font-bold' : 'text-text-sub'}`}>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Center Floating Action Button */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-5">
              <button 
                onClick={() => setIsFabOpen(!isFabOpen)}
                className={`flex items-center justify-center h-14 w-14 rounded-full text-white shadow-[0_8px_20px_rgba(17,115,212,0.4)] transition-all duration-300 border-4 border-bg-main active:scale-95 ${isFabOpen ? 'bg-slate-700 rotate-45' : 'bg-primary rotate-0'}`}
              >
                <span className="material-symbols-outlined text-3xl">add</span>
              </button>
            </div>

            {/* Right Items */}
            <div className="flex w-2/5 justify-between px-1">
              {rightItems.slice(0,2).map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link key={item.name} href={item.href} className="flex flex-col items-center justify-end gap-1 group w-12">
                    <span className={`material-symbols-outlined text-[22px] transition-colors ${isActive ? 'text-primary filled' : 'text-text-sub group-hover:text-primary'}`}>{item.icon}</span>
                    <span className={`text-[9px] font-medium tracking-wide ${isActive ? 'text-primary font-bold' : 'text-text-sub'}`}>{item.name}</span>
                  </Link>
                );
              })}
              {/* Settings / Theme Toggle */}
              <button onClick={toggleTheme} className="flex flex-col items-center justify-end gap-1 group w-12">
                <span className="material-symbols-outlined text-[22px] text-text-sub group-hover:text-primary transition-colors">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
                <span className="text-[9px] font-medium tracking-wide text-text-sub">Theme</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop overlay for Mobile FAB menu */}
      {isFabOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-bg-main/60 backdrop-blur-sm z-[90] transition-opacity"
          onClick={() => setIsFabOpen(false)}
        />
      )}
    </>
  );
}