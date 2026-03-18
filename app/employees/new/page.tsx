"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addEmployee } from "../../actions/employees";

export default function AddNewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Massive Granular Permissions State (Matching the Hub perfectly)
  const [perms, setPerms] = useState({
    orders: { view: true, create: true, edit_status: true, apply_discount: false, delete: false },
    customers: { view: true, create: true, edit: false, view_dues: false, delete: false },
    inventory: { view: false, add_material: false, adjust_stock: false, log_waste: false, manage_suppliers: false },
    financials: { view_dashboard: false, receive_payments: false, edit_payments: false, issue_refunds: false },
    catalog: { view: false, add_service: false, edit_pricing: false, delete_service: false },
    staff: { view: false, manage_access: false }
  });

  const toggleModule = (module: keyof typeof perms) => {
    setPerms(prev => {
      const newState = !prev[module].view;
      const updatedModule = { ...prev[module], view: newState };
      // If toggling module off, turn all sub-permissions off too to be safe
      if (!newState) {
        Object.keys(updatedModule).forEach(k => {
          (updatedModule as any)[k] = false;
        });
      }
      return { ...prev, [module]: updatedModule };
    });
  };

  const togglePerm = (module: keyof typeof perms, perm: string) => {
    setPerms(prev => ({
      ...prev,
      [module]: { ...prev[module], [perm]: !(prev[module] as any)[perm] }
    }));
  };

  const toggleAllInModule = (module: keyof typeof perms, state: boolean) => {
    setPerms(prev => {
      const updatedModule = { ...prev[module] };
      Object.keys(updatedModule).forEach(k => { (updatedModule as any)[k] = state; });
      return { ...prev, [module]: updatedModule };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await addEmployee(formData, perms);
    if (result.success) {
      router.push("/employees");
    } else {
      alert(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-main text-text-main min-h-screen flex flex-col font-display overflow-x-hidden pb-10">
      
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-surface p-4 border-b border-border-subtle shadow-sm md:pt-6">
        <Link href="/employees" className="flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-bg-main rounded-full transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Link>
        <h2 className="text-lg font-black leading-tight flex-1 text-center pr-10">New Employee</h2>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto md:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* --- Basic Information Section --- */}
          <section className="px-4 pt-6 md:p-8 md:bg-surface md:rounded-3xl md:border md:border-border-subtle md:shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-sub mb-5 pl-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">badge</span> Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-sub ml-1">Full Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub"><span className="material-symbols-outlined text-[20px]">person</span></span>
                  <input required name="fullName" type="text" placeholder="Enter full name" className="w-full rounded-xl border border-border-subtle bg-bg-main text-text-main focus:ring-2 ring-primary outline-none h-12 pl-12 pr-4 font-bold text-sm shadow-inner" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-sub ml-1">Designation</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub"><span className="material-symbols-outlined text-[20px]">work</span></span>
                  <input required name="designation" type="text" placeholder="e.g. Graphic Designer" className="w-full rounded-xl border border-border-subtle bg-bg-main text-text-main focus:ring-2 ring-primary outline-none h-12 pl-12 pr-4 font-bold text-sm shadow-inner" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-sub ml-1">Employee ID</label>
                <input required name="empId" type="text" placeholder="e.g. VP-04" className="w-full rounded-xl border border-border-subtle bg-bg-main text-text-main focus:ring-2 ring-primary outline-none h-12 px-4 font-bold text-sm shadow-inner" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-sub ml-1">Mobile Number (Login ID)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub"><span className="material-symbols-outlined text-[20px]">call</span></span>
                  <input required name="mobile" type="tel" placeholder="10 digit number" className="w-full rounded-xl border border-border-subtle bg-bg-main text-text-main focus:ring-2 ring-primary outline-none h-12 pl-12 pr-4 font-bold text-sm shadow-inner" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-sub ml-1">Initial Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub"><span className="material-symbols-outlined text-[20px]">lock</span></span>
                  <input required name="password" type="text" defaultValue="vidya123" className="w-full rounded-xl border border-border-subtle bg-bg-main text-text-main focus:ring-2 ring-primary outline-none h-12 pl-12 pr-4 font-bold text-sm shadow-inner" />
                </div>
                <p className="text-[10px] font-bold text-text-sub mt-1 ml-1">Default password for their first login.</p>
              </div>
            </div>
          </section>

          {/* --- Feature Access Section --- */}
          <section className="px-4 pb-6 md:p-8 md:bg-surface md:rounded-3xl md:border md:border-border-subtle md:shadow-sm">
            <div className="flex items-center justify-between mb-6 pl-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-warning flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span> Master Access Control
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Module: Orders */}
              <div className={`rounded-2xl border transition-all overflow-hidden ${perms.orders.view ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border-subtle bg-surface'}`}>
                <div className="px-5 py-4 flex items-center justify-between bg-surface border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 border border-blue-200"><span className="material-symbols-outlined">shopping_cart</span></div>
                    <span className="font-black text-text-main">Orders Pipeline</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={perms.orders.view} onChange={() => toggleModule('orders')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                {perms.orders.view && (
                  <div className="p-5 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-4">
                      <button type="button" onClick={() => toggleAllInModule('orders', true)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-primary hover:text-white transition-colors">Select All</button>
                      <button type="button" onClick={() => toggleAllInModule('orders', false)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors">Clear</button>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Create Orders & Quotes</span>
                      <input type="checkbox" checked={perms.orders.create} onChange={() => togglePerm('orders', 'create')} className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary/50 bg-surface" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Update Factory Status (Printing, Ready)</span>
                      <input type="checkbox" checked={perms.orders.edit_status} onChange={() => togglePerm('orders', 'edit_status')} className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary/50 bg-surface" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Apply Financial Discounts</span>
                      <input type="checkbox" checked={perms.orders.apply_discount} onChange={() => togglePerm('orders', 'apply_discount')} className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary/50 bg-surface" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group p-2 bg-danger/5 border border-danger/10 rounded-lg transition-colors mt-2">
                      <span className="text-sm font-black text-danger">Delete Orders Permanently</span>
                      <input type="checkbox" checked={perms.orders.delete} onChange={() => togglePerm('orders', 'delete')} className="w-5 h-5 rounded border-danger/30 text-danger focus:ring-danger/50 bg-surface" />
                    </label>
                  </div>
                )}
              </div>

              {/* Module: Inventory */}
              <div className={`rounded-2xl border transition-all overflow-hidden ${perms.inventory.view ? 'border-emerald-500/40 bg-emerald-500/5 shadow-sm' : 'border-border-subtle bg-surface'}`}>
                <div className="px-5 py-4 flex items-center justify-between bg-surface border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200"><span className="material-symbols-outlined">inventory_2</span></div>
                    <span className="font-black text-text-main">Factory Inventory</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={perms.inventory.view} onChange={() => toggleModule('inventory')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                {perms.inventory.view && (
                  <div className="p-5 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-4">
                      <button type="button" onClick={() => toggleAllInModule('inventory', true)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-emerald-500 hover:text-white transition-colors">Select All</button>
                      <button type="button" onClick={() => toggleAllInModule('inventory', false)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors">Clear</button>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-emerald-600 transition-colors">Add New Materials to DB</span>
                      <input type="checkbox" checked={perms.inventory.add_material} onChange={() => togglePerm('inventory', 'add_material')} className="w-5 h-5 rounded border-border-subtle text-emerald-500 focus:ring-emerald-500/50 bg-surface" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-emerald-600 transition-colors">Manually Adjust / Restock Levels</span>
                      <input type="checkbox" checked={perms.inventory.adjust_stock} onChange={() => togglePerm('inventory', 'adjust_stock')} className="w-5 h-5 rounded border-border-subtle text-emerald-500 focus:ring-emerald-500/50 bg-surface" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-emerald-600 transition-colors">Log Machine Waste / Damages</span>
                      <input type="checkbox" checked={perms.inventory.log_waste} onChange={() => togglePerm('inventory', 'log_waste')} className="w-5 h-5 rounded border-border-subtle text-emerald-500 focus:ring-emerald-500/50 bg-surface" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-emerald-600 transition-colors">Manage External Suppliers</span>
                      <input type="checkbox" checked={perms.inventory.manage_suppliers} onChange={() => togglePerm('inventory', 'manage_suppliers')} className="w-5 h-5 rounded border-border-subtle text-emerald-500 focus:ring-emerald-500/50 bg-surface" />
                    </label>
                  </div>
                )}
              </div>

              {/* Module: Customers */}
              <div className={`rounded-2xl border transition-all overflow-hidden ${perms.customers.view ? 'border-purple-500/40 bg-purple-500/5 shadow-sm' : 'border-border-subtle bg-surface'}`}>
                <div className="px-5 py-4 flex items-center justify-between bg-surface border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 border border-purple-200"><span className="material-symbols-outlined">group</span></div>
                    <span className="font-black text-text-main">Client Management</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={perms.customers.view} onChange={() => toggleModule('customers')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
                {perms.customers.view && (
                  <div className="p-5 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-4">
                      <button type="button" onClick={() => toggleAllInModule('customers', true)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-purple-500 hover:text-white transition-colors">Select All</button>
                      <button type="button" onClick={() => toggleAllInModule('customers', false)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors">Clear</button>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-purple-600 transition-colors">Add New Clients</span>
                      <input type="checkbox" checked={perms.customers.create} onChange={() => togglePerm('customers', 'create')} className="w-5 h-5 rounded border-border-subtle text-purple-500 focus:ring-purple-500/50 bg-surface" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-purple-600 transition-colors">See Client Financial Dues</span>
                      <input type="checkbox" checked={perms.customers.view_dues} onChange={() => togglePerm('customers', 'view_dues')} className="w-5 h-5 rounded border-border-subtle text-purple-500 focus:ring-purple-500/50 bg-surface" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group p-2 bg-danger/5 border border-danger/10 rounded-lg transition-colors mt-2">
                      <span className="text-sm font-black text-danger">Delete Clients</span>
                      <input type="checkbox" checked={perms.customers.delete} onChange={() => togglePerm('customers', 'delete')} className="w-5 h-5 rounded border-danger/30 text-danger focus:ring-danger/50 bg-surface" />
                    </label>
                  </div>
                )}
              </div>

              {/* Module: Financials */}
              <div className={`rounded-2xl border transition-all overflow-hidden ${perms.financials.view_dashboard ? 'border-amber-500/40 bg-amber-500/5 shadow-sm' : 'border-border-subtle bg-surface'}`}>
                <div className="px-5 py-4 flex items-center justify-between bg-surface border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200"><span className="material-symbols-outlined">account_balance</span></div>
                    <span className="font-black text-text-main">Financials</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={perms.financials.view_dashboard} onChange={() => toggleModule('financials')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                {perms.financials.view_dashboard && (
                  <div className="p-5 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-4">
                      <button type="button" onClick={() => toggleAllInModule('financials', true)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-amber-500 hover:text-white transition-colors">Select All</button>
                      <button type="button" onClick={() => toggleAllInModule('financials', false)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors">Clear</button>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-amber-600 transition-colors">Receive & Log Payments</span>
                      <input type="checkbox" checked={perms.financials.receive_payments} onChange={() => togglePerm('financials', 'receive_payments')} className="w-5 h-5 rounded border-border-subtle text-amber-500 focus:ring-amber-500/50 bg-surface" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group p-2 bg-danger/5 border border-danger/10 rounded-lg transition-colors mt-2">
                      <span className="text-sm font-black text-danger">Edit Past Payments / Refunds</span>
                      <input type="checkbox" checked={perms.financials.edit_payments} onChange={() => togglePerm('financials', 'edit_payments')} className="w-5 h-5 rounded border-danger/30 text-danger focus:ring-danger/50 bg-surface" />
                    </label>
                  </div>
                )}
              </div>
              
              {/* Module: Catalog */}
              <div className={`rounded-2xl border transition-all overflow-hidden ${perms.catalog.view ? 'border-pink-500/40 bg-pink-500/5 shadow-sm' : 'border-border-subtle bg-surface'}`}>
                <div className="px-5 py-4 flex items-center justify-between bg-surface border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-pink-100 text-pink-600 border border-pink-200"><span className="material-symbols-outlined">sell</span></div>
                    <span className="font-black text-text-main">Services & Catalog</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={perms.catalog.view} onChange={() => toggleModule('catalog')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                  </label>
                </div>
                {perms.catalog.view && (
                  <div className="p-5 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-4">
                      <button type="button" onClick={() => toggleAllInModule('catalog', true)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-pink-500 hover:text-white transition-colors">Select All</button>
                      <button type="button" onClick={() => toggleAllInModule('catalog', false)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors">Clear</button>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-pink-600 transition-colors">Add New Service</span>
                      <input type="checkbox" checked={perms.catalog.add_service} onChange={() => togglePerm('catalog', 'add_service')} className="w-5 h-5 rounded border-border-subtle text-pink-500 focus:ring-pink-500/50 bg-surface" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                      <span className="text-sm font-bold text-text-main group-hover:text-pink-600 transition-colors">Edit Pricing & GST</span>
                      <input type="checkbox" checked={perms.catalog.edit_pricing} onChange={() => togglePerm('catalog', 'edit_pricing')} className="w-5 h-5 rounded border-border-subtle text-pink-500 focus:ring-pink-500/50 bg-surface" />
                    </label>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* Sticky Bottom Action */}
          <div className="sticky bottom-0 bg-surface/90 backdrop-blur-xl p-4 border-t border-border-subtle z-50 md:bg-transparent md:border-none md:p-0 mt-4 md:mb-10">
            <button type="submit" disabled={loading} className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-blue-600 text-white text-lg font-black shadow-xl shadow-primary/30 transition-transform active:scale-[0.98] disabled:opacity-50">
              {loading ? <span className="material-symbols-outlined animate-spin text-2xl">refresh</span> : <span className="material-symbols-outlined text-2xl">person_add</span>}
              {loading ? "Processing..." : "Register Employee"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}