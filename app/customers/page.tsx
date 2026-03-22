"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCustomers } from "../actions/customer";
import { supabase } from "../../lib/supabase"; 

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
        
        // Fetch active order counts for these customers safely
        const { data: orders } = await supabase
          .from("orders")
          .select("client_id")
          .not("status", "in", '("Collected","Delivered")');
          
        const counts: Record<string, number> = {};
        orders?.forEach((o: any) => {
          counts[o.client_id] = (counts[o.client_id] || 0) + 1;
        });
        setOrderCounts(counts);
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  const filteredCustomers = customers.filter(c => {
    // Safely extract clients_data whether Supabase returns it as an array or object
    const clientData = Array.isArray(c.clients_data) ? c.clients_data[0] : c.clients_data;
    const bizName = clientData?.business_name || "";
    return (
      c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone_number?.includes(searchQuery) ||
      bizName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <header className="px-6 py-8 md:py-10">
        <h1 className="text-3xl font-display font-bold text-[var(--text)] tracking-tight">
          Client <span className="text-gradient">Directory</span>
        </h1>
      </header>

      {/* Search & Action */}
      <div className="px-6 pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]">search</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="vp-input pl-12 h-12"
              placeholder="        Search by name, phone, or business..." 
            />
          </div>
          <button className="btn-primary h-12 justify-center shrink-0">
            <span className="material-symbols-outlined sz-20">person_add</span>
            New Customer
          </button>
        </div>
      </div>

      {/* List */}
      <div className="px-6 pb-24 overflow-y-auto flex-1 stagger-children flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="vp-spinner"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-3)] font-medium glass-card p-8">
            No customers found matching "{searchQuery}"
          </div>
        ) : (
          filteredCustomers.map((customer, idx) => {
            const clientData = Array.isArray(customer.clients_data) ? customer.clients_data[0] : customer.clients_data;
            const businessName = clientData?.business_name;
            const dues = clientData?.total_dues || 0;
            const activeCount = orderCounts[customer.id] || 0;
            const initials = customer.full_name ? customer.full_name.substring(0, 2).toUpperCase() : "??";
            
            return (
              <Link href={`/customers/${customer.id}`} key={customer.id} className="block group">
                <div className="glass-card p-5 hover:border-primary transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-2)] flex items-center justify-center text-white font-display font-bold text-xl shadow-lg shrink-0">
                      {initials}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[var(--text)] font-bold text-lg truncate group-hover:text-primary transition-colors">
                        {customer.full_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-2)] truncate">
                        {businessName && (
                          <span className="flex items-center gap-1 bg-[var(--surface-2)] px-2 py-0.5 rounded-md border border-[var(--border)] font-medium">
                            <span className="material-symbols-outlined sz-14">storefront</span>
                            {businessName}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-mono text-xs">
                          <span className="material-symbols-outlined sz-14">call</span>
                          {customer.phone_number}
                        </span>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-2)] group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                      <span className="material-symbols-outlined sz-20">arrow_forward</span>
                    </div>
                  </div>

                  {/* Smart Indicators */}
                  <div className="mt-4 pt-4 border-t border-[var(--border)] flex gap-3">
                    <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 ${activeCount > 0 ? 'bg-[rgba(109,40,217,0.1)] text-[var(--primary)]' : 'bg-[var(--surface-3)] text-[var(--text-3)]'}`}>
                      <span className="material-symbols-outlined sz-16">{activeCount > 0 ? 'receipt_long' : 'check_circle'}</span>
                      {activeCount > 0 ? `${activeCount} Active Orders` : 'No Active Orders'}
                    </div>
                    <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-1 ${dues > 0 ? 'bg-[rgba(239,68,68,0.1)] text-[#EF4444]' : 'bg-[rgba(16,185,129,0.1)] text-[#10B981]'}`}>
                      <span className="material-symbols-outlined sz-16">{dues > 0 ? 'warning' : 'verified_user'}</span>
                      {dues > 0 ? `₹${dues} Due` : 'All Cleared'}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}