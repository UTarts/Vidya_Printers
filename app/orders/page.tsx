"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getOrders } from "../actions/orders";

export default function OrdersPage() {
  const [loadingData, setLoadingData] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    async function fetchAllData() {
      setLoadingData(true);
      const ordersRes = await getOrders();
      if (ordersRes.success) setOrders(ordersRes.data);
      setLoadingData(false);
    }
    fetchAllData();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (o.order_items && o.order_items[0]?.custom_service_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          o.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "All") return matchesSearch;
    if (filter === "Quotes") return matchesSearch && o.order_type === "Quotation";
    if (filter === "Completed") return matchesSearch && (o.status === "Ready" || o.status === "Collected");
    if (filter === "In Production") return matchesSearch && (o.status === "Pending" || o.status === "Printing");
    
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-bg-main relative">
      
      {/* Top Navigation / Header */}
      <header className="flex items-center justify-between px-4 pt-8 pb-4 bg-surface border-b border-border-subtle sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight text-text-main ml-2">Order Directory</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop specific Create Button */}
          <Link href="/orders/new" className="hidden md:flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Order
          </Link>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-main text-text-main hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
        </div>
      </header>

      {/* Search & Filters Area */}
      <div className="px-4 py-3 bg-surface sticky top-[80px] z-10 shadow-sm border-b border-border-subtle">
        <div className="relative mb-3 max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-text-sub">search</span>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border-none rounded-xl leading-5 bg-bg-main text-text-main placeholder-text-sub focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm transition-all" 
            placeholder="Search ID, client, or job name..." 
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {["All", "In Production", "Quotes", "Completed"].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                filter === f 
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                  : 'bg-bg-main text-text-sub hover:bg-border-subtle border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content List */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 space-y-3 pt-4">
        {loadingData ? (
          <div className="flex justify-center items-center h-40">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-2xl border border-border-subtle">
            <span className="material-symbols-outlined text-text-sub text-4xl mb-2">receipt_long</span>
            <h3 className="text-text-main font-bold">No Orders Found</h3>
            <p className="text-text-sub text-sm">Create a new job to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const firstItem = order.order_items?.[0]?.custom_service_name || 'Custom Job';
              const extraItemsCount = order.order_items ? order.order_items.length - 1 : 0;
              const isQuote = order.order_type === 'Quotation';
              const balance = order.total_amount - (order.amount_paid || 0);
              
              // Dynamic Status Styling
              let statusColor = "bg-primary/10 text-primary";
              let statusDot = "bg-primary";
              if (isQuote) { statusColor = "bg-purple-500/10 text-purple-600"; statusDot = "bg-purple-500"; }
              else if (order.status === "Pending") { statusColor = "bg-orange-500/10 text-orange-600"; statusDot = "bg-orange-500"; }
              else if (order.status === "Printing") { statusColor = "bg-blue-500/10 text-blue-600"; statusDot = "bg-blue-500"; }
              else if (order.status === "Ready" || order.status === "Collected") { statusColor = "bg-emerald-500/10 text-emerald-600"; statusDot = "bg-emerald-500"; }

              return (
                <div key={order.id} className="bg-surface rounded-2xl p-4 border border-border-subtle shadow-sm hover:border-primary/40 transition-colors flex flex-col h-full">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-text-main font-black text-sm">#{order.id.split('-')[0].toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide flex items-center gap-1.5 ${statusColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot} ${order.status === 'Printing' ? 'animate-pulse' : ''}`}></span>
                          {isQuote ? 'Quote' : order.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-text-main text-base leading-snug truncate" title={firstItem}>{firstItem}</h3>
                      {extraItemsCount > 0 && <p className="text-[10px] text-primary font-bold mt-0.5">+ {extraItemsCount} more items</p>}
                      <p className="text-text-sub text-xs mt-1 truncate">{order.profiles?.full_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-text-main text-lg">₹{order.total_amount}</p>
                      {balance > 0 && !isQuote && <p className="text-danger text-[10px] font-bold mt-0.5">Due: ₹{balance}</p>}
                      {balance <= 0 && !isQuote && <p className="text-emerald-500 text-[10px] font-bold mt-0.5">Paid</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border-subtle">
                    <div className="flex-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-text-sub text-[16px]">calendar_today</span>
                      <span className="text-xs font-semibold text-text-sub">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Link href={`/orders/${order.id}`} className="p-2 rounded-lg bg-bg-main text-primary hover:bg-primary hover:text-white transition-colors group relative" title="Open Hub">
                        <span className="material-symbols-outlined text-[18px]">launch</span>
                      </Link>
                      <button className="p-2 rounded-lg bg-bg-main text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors" title="WhatsApp">
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                      </button>
                      <button className="p-2 rounded-lg bg-bg-main text-purple-600 hover:bg-purple-500 hover:text-white transition-colors" title="Print Job Sheet">
                        <span className="material-symbols-outlined text-[18px]">print</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}