"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCustomers } from "../actions/customer";
import { supabase } from "../../lib/supabase"; // Needed to fetch order counts quickly

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchAll() {
      const res = await getCustomers();
      if (res.success) {
        setCustomers(res.data);
        
        // Fetch active order counts for these customers
        const { data: orders } = await supabase
          .from("orders")
          .select("client_id")
          .not("status", "in", '("Collected","Delivered")');
          
        const counts: Record<string, number> = {};
        orders?.forEach(o => {
          counts[o.client_id] = (counts[o.client_id] || 0) + 1;
        });
        setOrderCounts(counts);
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone_number.includes(searchQuery) ||
    c.clients_data?.[0]?.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="font-display antialiased bg-bg-main min-h-screen flex flex-col overflow-hidden text-text-main pb-20 md:pb-0">
      <header className="flex items-center justify-between px-4 py-3 bg-bg-main border-b border-border-subtle sticky top-0 z-10 md:pt-8">
        <h1 className="text-xl font-black flex-1 pr-2 tracking-tight">Customers</h1>
        <button className="flex items-center justify-center p-2 rounded-full hover:bg-surface transition-colors text-text-main relative">
          <span className="material-symbols-outlined text-[24px]">filter_list</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 py-4 space-y-4 sticky top-0 z-20 bg-bg-main/95 backdrop-blur-md">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-text-sub">search</span>
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-3 py-3.5 rounded-xl border-none ring-1 ring-border-subtle bg-surface text-text-main placeholder-text-sub focus:ring-2 focus:ring-primary focus:outline-none shadow-sm font-medium" 
              placeholder="Search by name or business..." 
            />
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform">
            <span className="material-symbols-outlined">person_add</span>
            <span>New Customer</span>
          </button>
        </div>

        <div className="flex flex-col px-4 gap-3 pb-8">
          {loading ? (
            <div className="flex justify-center py-10"><span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span></div>
          ) : filteredCustomers.map((customer, idx) => {
            const businessName = customer.clients_data?.[0]?.business_name;
            const dues = customer.clients_data?.[0]?.total_dues || 0;
            const activeCount = orderCounts[customer.id] || 0;
            const initials = customer.full_name.substring(0, 2).toUpperCase();
            const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500"];
            const color = colors[idx % colors.length];

            return (
              <Link href={`/customers/${customer.id}`} key={customer.id}>
                <div className="group flex flex-col p-4 rounded-2xl bg-surface border border-border-subtle shadow-sm hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-black text-lg shadow-sm`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-text-main truncate leading-tight">{customer.full_name}</p>
                      <p className="text-sm font-medium text-text-sub truncate mt-0.5">{businessName || customer.phone_number}</p>
                    </div>
                    <span className="material-symbols-outlined text-text-sub">chevron_right</span>
                  </div>
                  
                  {/* Smart Indicator Row */}
                  <div className="flex items-center gap-2 border-t border-border-subtle pt-3">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold flex-1 justify-center ${activeCount > 0 ? 'bg-primary/10 text-primary' : 'bg-bg-main text-text-sub'}`}>
                      <span className="material-symbols-outlined text-[16px]">{activeCount > 0 ? 'pending_actions' : 'check_circle'}</span>
                      {activeCount > 0 ? `${activeCount} Active Orders` : 'No Active Orders'}
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold flex-1 justify-center ${dues > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                      <span className="material-symbols-outlined text-[16px]">{dues > 0 ? 'account_balance_wallet' : 'verified_user'}</span>
                      {dues > 0 ? `Dues: ₹${dues}` : 'Cleared'}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}