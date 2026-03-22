"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revealMoney, setRevealMoney] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userProfile) setProfile(userProfile);
      setLoading(false);
    }
    fetchUserProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative w-full mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-5 pt-8 sticky top-0 z-50 bg-bg-main/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight text-text-main">Master Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-text-sub hover:text-primary transition-colors bg-surface rounded-full shadow-sm border border-border-subtle hidden md:flex">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-danger border-2 border-surface"></span>
          </button>
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[2px] shadow-sm">
            {profile?.role === 'superadmin' ? (
              <img src="https://tzaxthrqwfgbrcqmtuec.supabase.co/storage/v1/object/public/images/UTArt_Logo.webp" alt="Profile" className="h-full w-full rounded-full object-cover border-2 border-surface bg-white" />
            ) : (
              <div className="h-full w-full rounded-full bg-surface flex items-center justify-center border-2 border-surface">
                 <span className="material-symbols-outlined text-primary text-sm">person</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide space-y-6">
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#0a4a8b] p-8 shadow-xl shadow-primary/20">
          <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-black/20 blur-3xl"></div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-blue-100 text-xs font-black uppercase tracking-widest bg-black/20 w-fit px-3 py-1 rounded-full">Vidya Printers ERP</span>
            <h2 className="text-white text-3xl font-black leading-tight mt-2">Welcome back,<br/>{profile?.full_name?.split(' ')[0]}</h2>
            <p className="text-blue-100 text-sm font-medium mt-1">Here is what is happening in the factory today.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-text-main">Quick Overview</h3>
            <button className="text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors">View Report</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Stat: Total Orders */}
            <div className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm border border-border-subtle hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-primary">
                  <span className="material-symbols-outlined filled">receipt_long</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Total Orders</p>
                <p className="text-3xl font-black text-text-main mt-1">0</p>
              </div>
            </div>

            {/* Stat: Pending Jobs */}
            <div className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm border border-border-subtle hover:border-warning/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30 text-warning">
                  <span className="material-symbols-outlined filled">pending_actions</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Pending Jobs</p>
                <p className="text-3xl font-black text-text-main mt-1">0</p>
              </div>
            </div>

            {/* Stat: Low Stock */}
            <div className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm border border-border-subtle hover:border-danger/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 text-danger">
                  <span className="material-symbols-outlined filled">inventory_2</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Low Stock</p>
                <p className="text-3xl font-black text-text-main mt-1">0</p>
              </div>
            </div>

            {/* Stat: Revenue (Privacy Toggled) */}
            <div 
              onClick={() => setRevealMoney(!revealMoney)}
              className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm border border-border-subtle hover:border-success/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between z-10 relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-success">
                  <span className="material-symbols-outlined filled">payments</span>
                </div>
                <button className="text-text-sub group-hover:text-success transition-colors bg-bg-main p-1.5 rounded-full">
                  <span className="material-symbols-outlined text-[18px]">{revealMoney ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
              <div className="z-10 relative">
                <p className="text-xs font-bold text-text-sub uppercase tracking-wider">Today's Rev</p>
                <p className="text-3xl font-black text-text-main mt-1 tracking-tight">
                  {revealMoney ? '₹0' : '••••••'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Machine Production Status */}
        <div>
          <h3 className="text-lg font-black text-text-main mb-4">Factory Floor Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            
            <div className="bg-surface p-5 rounded-2xl border border-border-subtle flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-text-sub">print</span>
                <div className="h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse"></div>
              </div>
              <div className="mt-2">
                <p className="text-sm font-black text-text-main">Heidelberg XL</p>
                <p className="text-xs font-bold text-text-sub mt-0.5">Running • Ideal</p>
              </div>
            </div>

            <div className="bg-surface p-5 rounded-2xl border border-border-subtle flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-text-sub">imagesmode</span>
                <div className="h-2.5 w-2.5 rounded-full bg-warning shadow-[0_0_10px_rgba(234,179,8,0.6)]"></div>
              </div>
              <div className="mt-2">
                <p className="text-sm font-black text-text-main">Flex Machine</p>
                <p className="text-xs font-bold text-text-sub mt-0.5">Idle • No Queue</p>
              </div>
            </div>

            <div className="bg-surface p-5 rounded-2xl border border-border-subtle flex flex-col gap-2 col-span-2 md:col-span-1">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-text-sub">cut</span>
                <div className="h-2.5 w-2.5 rounded-full bg-danger shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
              </div>
              <div className="mt-2">
                <p className="text-sm font-black text-text-main">Polar Cutter</p>
                <p className="text-xs font-bold text-text-sub mt-0.5">Maintenance</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}