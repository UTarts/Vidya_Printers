"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getEmployeeHub, updateEmployeeProfile, updateEmployeePermissions, resetEmployeePassword } from "../../actions/employees";

export default function EmployeeHubPage() {
  const params = useParams();
  const employeeId = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline"); // timeline, permissions, settings
  
  const [profile, setProfile] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  
  // Security State
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Massive Granular Permissions State
  const [perms, setPerms] = useState({
    orders: { view: false, create: false, edit_status: false, apply_discount: false, delete: false },
    customers: { view: false, create: false, edit: false, view_dues: false, delete: false },
    inventory: { view: false, add_material: false, adjust_stock: false, log_waste: false, manage_suppliers: false },
    financials: { view_dashboard: false, receive_payments: false, edit_payments: false, issue_refunds: false },
    catalog: { view: false, add_service: false, edit_pricing: false, delete_service: false },
    staff: { view: false, manage_access: false }
  });

  useEffect(() => {
    async function loadData() {
      const res = await getEmployeeHub(employeeId);
      if (res.success) {
        setProfile(res.profile);
        setActivityLog(res.activityLog);
        // Merge DB permissions with our robust default structure to prevent undefined errors
        if (res.profile?.permissions) {
          setPerms(prev => ({ ...prev, ...res.profile.permissions }));
        }
      }
      setLoading(false);
    }
    loadData();
  }, [employeeId]);

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      fullName: formData.get("fullName"),
      designation: formData.get("designation"),
      empId: formData.get("empId"),
      status: formData.get("status"),
    };
    await updateEmployeeProfile(employeeId, payload);
    setSaving(false);
    alert("Profile & Status Updated Successfully.");
  };

  const handlePermissionsUpdate = async () => {
    setSaving(true);
    await updateEmployeePermissions(employeeId, perms);
    setSaving(false);
    alert("Granular Permissions Saved.");
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("Password must be at least 6 characters.");
    setPasswordLoading(true);
    const res = await resetEmployeePassword(employeeId, newPassword);
    if (res.success) {
      alert("Password has been forcefully reset.");
      setNewPassword("");
    } else {
      alert("Failed to reset password.");
    }
    setPasswordLoading(false);
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-bg-main"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>;

  const isLocked = profile?.status === "Inactive";

  return (
    <div className="bg-bg-main text-text-main min-h-screen flex flex-col font-display overflow-x-hidden pb-10">
      
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-surface p-4 border-b border-border-subtle shadow-sm md:pt-6">
        <Link href="/employees" className="flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-bg-main rounded-full transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Link>
        <div className="flex-1 px-4">
          <h2 className="text-lg font-black leading-tight truncate">{profile?.full_name}</h2>
          <p className="text-[10px] font-bold text-text-sub uppercase tracking-wider">{profile?.designation} • {profile?.emp_id}</p>
        </div>
        <div className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm ${isLocked ? 'bg-danger/10 text-danger border-danger/30' : profile?.status === 'On Leave' ? 'bg-warning/10 text-warning border-warning/30' : 'bg-success/10 text-success border-success/30'}`}>
          {profile?.status}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex w-full px-4 bg-surface border-b border-border-subtle sticky top-[72px] md:top-[88px] z-40 shadow-sm">
        <button onClick={() => setActiveTab("timeline")} className={`flex-1 text-center py-3 border-b-2 font-black text-xs uppercase tracking-wider transition-colors ${activeTab === "timeline" ? "border-primary text-primary" : "border-transparent text-text-sub hover:text-text-main"}`}>
          Activity Log
        </button>
        <button onClick={() => setActiveTab("permissions")} className={`flex-1 text-center py-3 border-b-2 font-black text-xs uppercase tracking-wider transition-colors ${activeTab === "permissions" ? "border-primary text-primary" : "border-transparent text-text-sub hover:text-text-main"}`}>
          Access Control
        </button>
        <button onClick={() => setActiveTab("settings")} className={`flex-1 text-center py-3 border-b-2 font-black text-xs uppercase tracking-wider transition-colors ${activeTab === "settings" ? "border-primary text-primary" : "border-transparent text-text-sub hover:text-text-main"}`}>
          Profile & Security
        </button>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6">
        
        {/* --- TAB: ACTIVITY LOG TIMELINE --- */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-4 rounded-2xl mb-6">
              <div>
                <h3 className="font-black text-primary text-sm uppercase tracking-widest">Complete Audit Trail</h3>
                <p className="text-xs font-bold text-text-sub mt-0.5">Showing every action performed by {profile?.full_name}</p>
              </div>
              <span className="material-symbols-outlined text-primary text-3xl">history</span>
            </div>

            {activityLog.length === 0 ? (
              <div className="text-center py-10 bg-surface rounded-2xl border border-border-subtle">
                <span className="material-symbols-outlined text-text-sub text-4xl mb-2">history_toggle_off</span>
                <h3 className="text-text-main font-bold">No Activity Found</h3>
                <p className="text-text-sub text-sm">This employee hasn't logged any actions yet.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-border-subtle ml-4 pl-6 space-y-6 pb-10">
                {activityLog.map(event => {
                  let icon = "bolt"; let color = "text-text-sub bg-surface";
                  if (event.event_type === "Payment") { icon = "payments"; color = "text-success bg-success/10 border-success/30"; }
                  else if (event.event_type === "Status_Change") { icon = "published_with_changes"; color = "text-primary bg-primary/10 border-primary/30"; }
                  else if (event.event_type === "Attachment") { icon = "attachment"; color = "text-purple-500 bg-purple-500/10 border-purple-500/30"; }

                  return (
                    <div key={event.id} className="relative">
                      <div className={`absolute -left-[39px] w-8 h-8 rounded-full border flex items-center justify-center z-10 shadow-sm ${color}`}>
                        <span className="material-symbols-outlined text-[16px]">{icon}</span>
                      </div>
                      <div className="bg-surface border border-border-subtle p-4 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-sub bg-bg-main px-2 py-0.5 rounded">{event.event_type}</span>
                          <span className="text-[10px] font-bold text-text-sub">{new Date(event.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-medium text-text-main">{event.description}</p>
                        
                        {/* Context Tags */}
                        <div className="mt-3 flex gap-2">
                           {event.client_id && <span className="text-[9px] font-black uppercase tracking-wider bg-surface border border-border-subtle px-2 py-1 rounded shadow-sm text-text-sub">Client: {event.client_id.substring(0,8)}...</span>}
                           {event.orders?.display_id && <span className="text-[9px] font-black uppercase tracking-wider bg-primary/10 border border-primary/20 px-2 py-1 rounded shadow-sm text-primary flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">link</span> Order {event.orders.display_id}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: GRANULAR PERMISSIONS --- */}
        {activeTab === "permissions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-warning/10 border border-warning/20 p-4 rounded-2xl">
              <div>
                <h3 className="font-black text-warning text-sm uppercase tracking-widest">Master Access Control</h3>
                <p className="text-xs font-bold text-warning/80 mt-0.5">Warning: Modifying these impacts what the employee can see and delete.</p>
              </div>
              <button onClick={handlePermissionsUpdate} disabled={saving} className="bg-warning text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg hover:bg-yellow-600 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2">
                {saving ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                Apply Changes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Module: Orders */}
              <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-primary/5 border-b border-border-subtle p-4 flex justify-between items-center">
                  <h4 className="font-black text-primary uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined">shopping_cart</span> Orders Pipeline</h4>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAllInModule('orders', true)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-primary hover:text-white transition-colors">Select All</button>
                    <button onClick={() => toggleAllInModule('orders', false)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors">Clear</button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                    <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">View All Orders</span>
                    <input type="checkbox" checked={perms.orders.view} onChange={() => togglePerm('orders', 'view')} className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary/50 bg-surface" />
                  </label>
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
              </div>

              {/* Module: Inventory */}
              <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-emerald-500/5 border-b border-border-subtle p-4 flex justify-between items-center">
                  <h4 className="font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined">inventory_2</span> Factory Inventory</h4>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAllInModule('inventory', true)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-emerald-500 hover:text-white transition-colors">Select All</button>
                    <button onClick={() => toggleAllInModule('inventory', false)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors">Clear</button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                    <span className="text-sm font-bold text-text-main group-hover:text-emerald-600 transition-colors">View Warehouse Stock</span>
                    <input type="checkbox" checked={perms.inventory.view} onChange={() => togglePerm('inventory', 'view')} className="w-5 h-5 rounded border-border-subtle text-emerald-500 focus:ring-emerald-500/50 bg-surface" />
                  </label>
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
              </div>

              {/* Module: Customers */}
              <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-purple-500/5 border-b border-border-subtle p-4 flex justify-between items-center">
                  <h4 className="font-black text-purple-600 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined">group</span> Client Management</h4>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAllInModule('customers', true)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-purple-500 hover:text-white transition-colors">Select All</button>
                    <button onClick={() => toggleAllInModule('customers', false)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors">Clear</button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                    <span className="text-sm font-bold text-text-main group-hover:text-purple-600 transition-colors">View Client Directory</span>
                    <input type="checkbox" checked={perms.customers.view} onChange={() => togglePerm('customers', 'view')} className="w-5 h-5 rounded border-border-subtle text-purple-500 focus:ring-purple-500/50 bg-surface" />
                  </label>
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
              </div>

              {/* Module: Financials */}
              <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-amber-500/5 border-b border-border-subtle p-4 flex justify-between items-center">
                  <h4 className="font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined">account_balance</span> Financials</h4>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAllInModule('financials', true)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-amber-500 hover:text-white transition-colors">Select All</button>
                    <button onClick={() => toggleAllInModule('financials', false)} className="text-[9px] font-black uppercase bg-surface border border-border-subtle px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors">Clear</button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                    <span className="text-sm font-bold text-text-main group-hover:text-amber-600 transition-colors">View Master Revenue Dashboard</span>
                    <input type="checkbox" checked={perms.financials.view_dashboard} onChange={() => togglePerm('financials', 'view_dashboard')} className="w-5 h-5 rounded border-border-subtle text-amber-500 focus:ring-amber-500/50 bg-surface" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-bg-main rounded-lg transition-colors">
                    <span className="text-sm font-bold text-text-main group-hover:text-amber-600 transition-colors">Receive & Log Payments</span>
                    <input type="checkbox" checked={perms.financials.receive_payments} onChange={() => togglePerm('financials', 'receive_payments')} className="w-5 h-5 rounded border-border-subtle text-amber-500 focus:ring-amber-500/50 bg-surface" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group p-2 bg-danger/5 border border-danger/10 rounded-lg transition-colors mt-2">
                    <span className="text-sm font-black text-danger">Edit Past Payments / Refunds</span>
                    <input type="checkbox" checked={perms.financials.edit_payments} onChange={() => togglePerm('financials', 'edit_payments')} className="w-5 h-5 rounded border-danger/30 text-danger focus:ring-danger/50 bg-surface" />
                  </label>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB: PROFILE & SECURITY SETTINGS --- */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Basic Info Form */}
            <div className="bg-surface border border-border-subtle rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="font-black text-text-main uppercase tracking-widest text-sm mb-5 border-b border-border-subtle pb-3">Edit Profile Details</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-sub ml-1 block mb-1">Full Name</label>
                  <input required name="fullName" defaultValue={profile?.full_name} className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-sub ml-1 block mb-1">Designation</label>
                    <input required name="designation" defaultValue={profile?.designation} className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-sub ml-1 block mb-1">Employee ID</label>
                    <input required name="empId" defaultValue={profile?.emp_id} className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-sub ml-1 block mb-1">Account Status</label>
                  <select name="status" defaultValue={profile?.status} className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-primary appearance-none">
                    <option value="Active">Active (Normal Access)</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive (Locked Out / Terminated)</option>
                  </select>
                  <p className="text-[10px] text-text-sub mt-1.5 font-medium ml-1">Setting to 'Inactive' immediately revokes app access.</p>
                </div>
                <button type="submit" disabled={saving} className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-black shadow-md shadow-primary/20 hover:bg-blue-600 transition-transform active:scale-95 disabled:opacity-50">
                  Save Details
                </button>
              </form>
            </div>

            {/* Security Actions */}
            <div className="bg-surface border border-border-subtle rounded-2xl p-5 md:p-6 shadow-sm h-fit">
              <h3 className="font-black text-danger uppercase tracking-widest text-sm mb-5 border-b border-border-subtle pb-3 flex items-center gap-2"><span className="material-symbols-outlined">security</span> Master Security</h3>
              
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-sub ml-1 block mb-1">Force Password Reset</label>
                  <input required minLength={6} type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Type new password here" className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-danger" />
                  <p className="text-[10px] text-text-sub mt-1.5 font-medium ml-1">This will log them out of all devices instantly.</p>
                </div>
                <button type="submit" disabled={passwordLoading} className="w-full bg-danger text-white py-3 rounded-xl font-black shadow-md shadow-danger/20 hover:bg-red-600 transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  {passwordLoading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">key</span>}
                  Force Reset Password
                </button>
              </form>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}