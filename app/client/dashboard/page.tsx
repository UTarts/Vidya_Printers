"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ClientSelfServicePortal() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [totalDues, setTotalDues] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchClientData();
  }, []);

  async function fetchClientData() {
    // 1. Get the logged-in customer
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // 2. Fetch their profile & dues
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*, clients_data(total_dues)")
      .eq("id", user.id)
      .single();

    if (userProfile) {
      setProfile(userProfile);
      setTotalDues(userProfile.clients_data?.[0]?.total_dues || 0);
    }

    // 3. Fetch their active and past orders
    const { data: orders } = await supabase
      .from("orders")
      .select("*, order_items(custom_service_name)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (orders) {
      setActiveOrders(orders.filter(o => o.status !== "Collected" && o.status !== "Delivered"));
      setOrderHistory(orders.filter(o => o.status === "Collected" || o.status === "Delivered"));
    }
    
    setLoading(false);
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-bg-main"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>;
  }

  const primaryOrder = activeOrders[0];

  return (
    <div className="bg-[#f8fafc] dark:bg-bg-main font-display antialiased text-slate-900 dark:text-white min-h-screen pb-24">
      
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-start sticky top-0 bg-[#f8fafc]/90 dark:bg-bg-main/90 backdrop-blur-md z-20">
        <div>
          <p className="text-slate-500 dark:text-text-sub text-sm font-black uppercase tracking-widest">Welcome Back,</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">{profile?.full_name}</h1>
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 shadow-sm cursor-pointer hover:bg-primary/20 transition-colors">
          <span className="material-symbols-outlined text-primary text-2xl">person</span>
        </div>
      </header>

      <main className="px-6 space-y-6 mt-2">
        
        {/* Pending Dues Banner */}
        {totalDues > 0 ? (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 shadow-xl shadow-red-500/20 text-white p-6 animate-in slide-in-from-top-2">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-100 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">error</span> Payment Pending
                </span>
                <button className="bg-white text-danger text-xs px-4 py-1.5 rounded-full font-black shadow-sm hover:scale-105 transition-transform active:scale-95">
                  Pay Now
                </button>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black tracking-tight">₹{totalDues}</span>
              </div>
              <p className="text-red-100 text-[10px] font-bold uppercase tracking-wider mt-4 opacity-90">Please clear your dues to avoid production delays.</p>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20 text-white p-6 relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-20"><span className="material-symbols-outlined text-8xl">verified</span></div>
             <h3 className="font-black text-lg">All Dues Cleared</h3>
             <p className="text-emerald-100 text-sm font-medium mt-1">Thank you for your prompt payments!</p>
          </section>
        )}

        {/* Live Order Tracking */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-text-sub mb-3 pl-1">Live Production Status</h2>
          
          {activeOrders.length === 0 ? (
            <div className="bg-white dark:bg-surface rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-border-subtle text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-border-subtle mb-2">check_circle</span>
              <p className="font-bold text-slate-500 dark:text-text-sub">No active orders right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-white dark:bg-surface rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-border-subtle relative">
                  <div className="flex justify-between items-start mb-5 border-b border-slate-100 dark:border-border-subtle pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{order.order_items?.[0]?.custom_service_name || "Custom Print Job"}</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-text-sub mt-1 uppercase tracking-wider">Order #{order.display_id || order.id.split('-')[0]}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-sm">
                      {order.status}
                    </span>
                  </div>

                  {/* Vertical Progress Tracker */}
                  <div className="relative pl-2">
                    <div className="absolute left-4 top-2 bottom-6 w-0.5 bg-slate-200 dark:bg-border-subtle"></div>
                    
                    <div className="flex gap-4 mb-5 relative z-10">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 shadow-sm ${order.status !== 'Draft' ? 'bg-success border-success text-white' : 'bg-white dark:bg-surface border-slate-300 dark:border-border-subtle'}`}>
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      </div>
                      <div className="-mt-1">
                        <p className={`text-sm font-black ${order.status !== 'Draft' ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-text-sub'}`}>Order Confirmed</p>
                      </div>
                    </div>

                    <div className="flex gap-4 mb-5 relative z-10">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 shadow-sm ${order.status === 'Printing' || order.status === 'Ready' ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-surface border-slate-300 dark:border-border-subtle'}`}>
                        {order.status === 'Printing' && <span className="material-symbols-outlined text-[12px] animate-spin">autorenew</span>}
                        {order.status === 'Ready' && <span className="material-symbols-outlined text-[12px]">check</span>}
                      </div>
                      <div className="-mt-1">
                        <p className={`text-sm font-black ${order.status === 'Printing' || order.status === 'Ready' ? 'text-primary' : 'text-slate-400 dark:text-text-sub'}`}>Printing & Production</p>
                        {order.status === 'Printing' && <p className="text-[10px] font-bold text-slate-400 dark:text-text-sub mt-0.5 uppercase tracking-wider">On Machine Now</p>}
                      </div>
                    </div>

                    <div className="flex gap-4 relative z-10">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 shadow-sm ${order.status === 'Ready' ? 'bg-success border-success text-white' : 'bg-white dark:bg-surface border-slate-300 dark:border-border-subtle'}`}>
                        {order.status === 'Ready' && <span className="material-symbols-outlined text-[12px]">check</span>}
                      </div>
                      <div className="-mt-1">
                        <p className={`text-sm font-black ${order.status === 'Ready' ? 'text-success' : 'text-slate-400 dark:text-text-sub'}`}>Ready for Pickup</p>
                        {order.status === 'Ready' && <p className="text-[10px] font-bold text-slate-400 dark:text-text-sub mt-0.5 uppercase tracking-wider">Awaiting Collection</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Order History */}
        <section>
          <div className="flex justify-between items-center mb-3 pl-1 border-b border-slate-200 dark:border-border-subtle pb-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-text-sub">Past Orders</h2>
          </div>
          
          <div className="space-y-3 pb-4">
            {orderHistory.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 dark:text-text-sub text-center py-4">No past orders.</p>
            ) : orderHistory.map(order => (
              <div key={order.id} className="bg-white dark:bg-surface p-4 rounded-2xl border border-slate-100 dark:border-border-subtle shadow-sm flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-bg-main border border-slate-200 dark:border-border-subtle flex items-center justify-center text-slate-500 dark:text-text-sub">
                    <span className="material-symbols-outlined">inventory_2</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[180px]">{order.order_items?.[0]?.custom_service_name}</h4>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-text-sub uppercase tracking-wider mt-0.5">{new Date(order.created_at).toLocaleDateString()} • Delivered</p>
                  </div>
                </div>
                <button className="h-10 w-10 rounded-full hover:bg-primary/10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors border border-transparent hover:border-primary/20">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Floating Action Button for Client */}
      <div className="fixed bottom-6 left-0 w-full px-6 flex justify-center z-30 pointer-events-none">
        <button onClick={() => alert("Redirecting to WhatsApp to chat with Sales...")} className="pointer-events-auto bg-primary text-white font-black py-4 px-8 rounded-full shadow-xl shadow-primary/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform w-full max-w-sm justify-center">
          <span className="material-symbols-outlined text-[20px]">support_agent</span>
          Chat with Press / New Request
        </button>
      </div>

    </div>
  );
}