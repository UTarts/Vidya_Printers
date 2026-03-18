"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getFinancialDashboard, logExpense } from "../actions/financials";

export default function FinancialsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revealMoney, setRevealMoney] = useState(false);
  const [currentUser, setCurrentUser] = useState("Admin");
  
  const [metrics, setMetrics] = useState({ revenue: 0, dues: 0, expenses: 0, gst: 0, profit: 0 });
  const [expenseList, setExpenseList] = useState<any[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    async function loadUserAndData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        if (p) setCurrentUser(p.full_name.split(" ")[0]);
      }
      fetchData();
    }
    loadUserAndData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const res = await getFinancialDashboard();
    if (res.success) {
      setMetrics(res.metrics);
      setExpenseList(res.expenseList);
    }
    setLoading(false);
  }

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const res = await logExpense(formData, currentUser);
    if (res.success) {
      setShowExpenseModal(false);
      fetchData();
    } else {
      alert("Failed to log expense.");
    }
    setSaving(false);
  };

  const formatCurrency = (val: number) => revealMoney ? `₹${val.toLocaleString('en-IN')}` : '••••••';

  if (loading) return <div className="flex h-screen items-center justify-center bg-bg-main"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>;

  return (
    <div className="bg-bg-main text-text-main min-h-screen flex flex-col font-display overflow-x-hidden pb-24">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border-subtle p-4 shadow-sm md:pt-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1 rounded-full hover:bg-bg-main transition-colors">
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <h1 className="text-xl font-black tracking-tight">Master Ledger</h1>
        </div>
        <button onClick={() => setRevealMoney(!revealMoney)} className="bg-bg-main border border-border-subtle p-2 rounded-full text-text-sub hover:text-primary transition-colors flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-[20px]">{revealMoney ? 'visibility' : 'visibility_off'}</span>
        </button>
      </header>

      <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full space-y-6">
        
        {/* High-Level P&L Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-20"><span className="material-symbols-outlined text-8xl">account_balance</span></div>
            <h3 className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-1 relative z-10">Total Revenue Collected</h3>
            <p className="text-4xl font-black tracking-tight relative z-10">{formatCurrency(metrics.revenue)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-primary to-[#0a4a8b] rounded-3xl p-6 shadow-lg shadow-primary/20 text-white relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-20"><span className="material-symbols-outlined text-8xl">trending_up</span></div>
            <h3 className="text-blue-200 text-xs font-black uppercase tracking-widest mb-1 relative z-10">Estimated Profit (Rev - Exp)</h3>
            <p className="text-4xl font-black tracking-tight relative z-10">{formatCurrency(metrics.profit)}</p>
          </div>
        </section>

        {/* Operational Metrics */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-danger">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <h3 className="text-[10px] font-black uppercase tracking-widest">Market Dues</h3>
            </div>
            <p className="text-2xl font-black text-text-main">{formatCurrency(metrics.dues)}</p>
            <p className="text-[10px] font-bold text-text-sub mt-1">Pending in Khata</p>
          </div>

          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-orange-500">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <h3 className="text-[10px] font-black uppercase tracking-widest">Total Expenses</h3>
            </div>
            <p className="text-2xl font-black text-text-main">{formatCurrency(metrics.expenses)}</p>
            <p className="text-[10px] font-bold text-text-sub mt-1">Payouts & Bills</p>
          </div>

          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2 text-purple-500">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              <h3 className="text-[10px] font-black uppercase tracking-widest">GST Liability</h3>
            </div>
            <p className="text-2xl font-black text-text-main">{formatCurrency(metrics.gst)}</p>
            <p className="text-[10px] font-bold text-text-sub mt-1">Tax collected on orders</p>
          </div>
        </section>

        {/* Expense Log */}
        <section>
          <div className="flex justify-between items-center mb-4 pl-1 border-b border-border-subtle pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-text-main">Recent Expenses & Payouts</h2>
            <button onClick={() => setShowExpenseModal(true)} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">add</span> Log Expense
            </button>
          </div>
          
          <div className="space-y-3">
            {expenseList.length === 0 ? (
              <div className="bg-surface p-6 rounded-2xl border border-border-subtle text-center">
                <p className="text-sm font-bold text-text-sub">No expenses logged yet.</p>
              </div>
            ) : expenseList.map(exp => {
              let icon = "receipt"; let iconColor = "text-text-sub bg-bg-main";
              if (exp.category === "Supplier Payout") { icon = "local_shipping"; iconColor = "text-orange-500 bg-orange-500/10 border-orange-500/20"; }
              else if (exp.category === "Utility / Bill") { icon = "bolt"; iconColor = "text-blue-500 bg-blue-500/10 border-blue-500/20"; }
              else if (exp.category === "Maintenance") { icon = "build"; iconColor = "text-purple-500 bg-purple-500/10 border-purple-500/20"; }

              return (
                <div key={exp.id} className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${iconColor}`}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-text-main truncate pr-2">{exp.description || exp.category}</h4>
                      <p className="text-[10px] font-bold text-text-sub uppercase tracking-wider mt-0.5">{new Date(exp.created_at).toLocaleDateString()} • By {exp.logged_by}</p>
                    </div>
                  </div>
                  <span className="font-black text-danger text-base shrink-0">- {formatCurrency(exp.amount)}</span>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-bg-main/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md border border-border-subtle overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-bg-main/50">
              <h2 className="text-lg font-black text-text-main flex items-center gap-2"><span className="material-symbols-outlined text-danger">receipt_long</span> Log Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-text-sub hover:text-danger bg-surface p-1.5 rounded-full shadow-sm border border-border-subtle"><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleAddExpense} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Expense Category</label>
                  <div className="relative">
                    <select name="category" required className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-text-main text-sm appearance-none">
                      <option value="Supplier Payout">Supplier Payout (Raw Materials)</option>
                      <option value="Utility / Bill">Utility / Bill (Electricity, Internet)</option>
                      <option value="Maintenance">Machine Maintenance</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 text-text-sub pointer-events-none">expand_more</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Amount (₹)</label>
                  <input type="number" name="amount" required className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-black text-text-main text-lg" placeholder="0" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Description / Vendor Name</label>
                  <input type="text" name="description" required className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-text-main text-sm" placeholder="e.g. Paid Agarwal Mills for 50 reams" />
                </div>

                <button type="submit" disabled={saving} className="w-full bg-danger hover:bg-red-600 disabled:bg-danger/50 text-white font-black py-4 px-4 rounded-xl shadow-lg shadow-danger/30 mt-4 transition-all active:scale-95 text-lg flex items-center justify-center gap-2">
                  {saving && <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>}
                  {saving ? "Logging..." : "Confirm & Deduct"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}