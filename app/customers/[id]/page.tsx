"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { getCustomerHub, addTimelineEvent } from "../../actions/timeline";
import { supabase } from "../../../lib/supabase"; 

export default function CustomerHubPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  
  const [customer, setCustomer] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interaction States
  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  
  // Modal States
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [statusModal, setStatusModal] = useState(false);
  const [statusOrderId, setStatusOrderId] = useState("");
  const [newStatus, setNewStatus] = useState("Processing");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [timeline]);

  async function fetchData() {
    setLoading(true);
    const res = await getCustomerHub(id);
    if (res.success) {
      setCustomer(res.profile);
      setClientData(res.profile?.clients_data?.[0] || res.profile?.clients_data);
      setTimeline(res.timeline || []);
      setOrders(res.orders || []);
    }
    setLoading(false);
  }

  // --- ACTIONS ---

  async function handleSendMessage() {
    if (!message.trim()) return;
    setIsSubmitting(true);
    await addTimelineEvent({
      customerId: id,
      orderId: selectedOrderId,
      eventType: "Note",
      description: message.trim(),
      authorName: "Admin", // For demo purposes
    });
    setMessage("");
    setIsActionMenuOpen(false);
    await fetchData();
    setIsSubmitting(false);
  }

  async function handleReceivePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentAmount || isNaN(Number(paymentAmount))) return;
    setIsSubmitting(true);
    await addTimelineEvent({
      customerId: id,
      orderId: selectedOrderId, // Optional context
      eventType: "Payment",
      amount: Number(paymentAmount),
      description: `Payment received: ₹${paymentAmount}`,
      authorName: "Admin",
    });
    setPaymentAmount("");
    setPaymentModal(false);
    await fetchData();
    setIsSubmitting(false);
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!statusOrderId || !newStatus) return;
    setIsSubmitting(true);
    
    // Update the actual order status in the DB
    await supabase.from("orders").update({ status: newStatus }).eq("id", statusOrderId);
    
    // Log it in the timeline
    await addTimelineEvent({
      customerId: id,
      orderId: statusOrderId,
      eventType: "Status_Change",
      description: `Order status updated to ${newStatus}`,
      authorName: "Admin",
    });
    
    setStatusModal(false);
    await fetchData();
    setIsSubmitting(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    setIsActionMenuOpen(false);
    
    // For tomorrow's demo, we mock the file URL so it doesn't crash on large files without a bucket.
    // It will show a beautifully formatted message.
    await addTimelineEvent({
      customerId: id,
      orderId: selectedOrderId,
      eventType: "Note",
      description: `Attached a file: ${file.name}`,
      fileUrl: "https://via.placeholder.com/400x300.png?text=Demo+Attachment", 
      authorName: "Admin",
    });
    
    await fetchData();
    setIsSubmitting(false);
  }

  if (loading) return <div className="h-[100dvh] flex items-center justify-center"><div className="vp-spinner"></div></div>;

  const activeOrders = orders.filter(o => !["Collected", "Delivered"].includes(o.status));
  const dues = clientData?.total_dues || 0;

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--bg)] w-full overflow-hidden relative">
      
      {/* --- STICKY HEADER --- */}
      <div 
        onClick={() => setIsDrawerOpen(true)}
        className="flex items-center gap-3 px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] shadow-sm z-20 cursor-pointer active:bg-[var(--surface-2)] transition-colors"
      >
        <button onClick={(e) => { e.stopPropagation(); router.push('/customers'); }} className="p-2 -ml-2 text-[var(--text-2)] hover:text-[var(--primary)]">
          <span className="material-symbols-outlined sz-24">arrow_back</span>
        </button>
        
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-2)] flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
          {customer?.full_name?.substring(0, 2).toUpperCase() || "??"}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-[var(--text)] truncate text-lg leading-tight">{customer?.full_name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {dues > 0 ? (
              <span className="text-xs font-bold text-[#EF4444] flex items-center gap-0.5 bg-[rgba(239,68,68,0.1)] px-1.5 py-0.5 rounded-md">
                ₹{dues.toLocaleString()} Due
              </span>
            ) : (
              <span className="text-xs font-bold text-[#10B981] flex items-center gap-0.5 bg-[rgba(16,185,129,0.1)] px-1.5 py-0.5 rounded-md">
                Cleared
              </span>
            )}
            {activeOrders.length > 0 && (
              <span className="text-xs font-semibold text-[var(--primary)] flex items-center gap-0.5 bg-[rgba(109,40,217,0.1)] px-1.5 py-0.5 rounded-md">
                {activeOrders.length} Active
              </span>
            )}
          </div>
        </div>
        
        <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-2)]">
          <span className="material-symbols-outlined sz-20">more_vert</span>
        </div>
      </div>

      {/* --- CHAT TIMELINE --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-2)] pb-32 no-scrollbar" onClick={() => setIsActionMenuOpen(false)}>
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <span className="material-symbols-outlined sz-48 mb-2">forum</span>
            <p className="font-medium">No history yet.</p>
            <p className="text-sm">Send a message or log a payment.</p>
          </div>
        ) : (
          timeline.map((event, idx) => {
            const isSystem = event.event_type === "Status_Change";
            const isPayment = event.event_type === "Payment";
            const isAdmin = event.author_name !== "Client";
            
            if (isSystem) return (
              <div key={event.id} className="flex justify-center my-4">
                <span className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined sz-14">info</span>
                  {event.description}
                </span>
              </div>
            );

            if (isPayment) return (
              <div key={event.id} className="flex justify-center my-4">
                <div className="bg-gradient-to-r from-[rgba(16,185,129,0.1)] to-[rgba(16,185,129,0.05)] border border-[#10B981]/30 text-[#10B981] px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white">
                    <span className="material-symbols-outlined sz-18">check</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Payment Received</p>
                    <p className="text-xs opacity-80">{event.description}</p>
                  </div>
                </div>
              </div>
            );

            return (
              <div key={event.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} w-full animate-fade-in`}>
                <div className="flex items-baseline gap-2 mb-1 px-1">
                  <span className="text-[10px] font-bold text-[var(--text-3)]">{event.author_name}</span>
                  <span className="text-[9px] text-[var(--text-3)]">
                    {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className={`relative px-4 py-2.5 shadow-sm max-w-[85%] ${isAdmin ? 'bg-[var(--primary)] text-white rounded-2xl rounded-tr-sm' : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-2xl rounded-tl-sm'}`}>
                  {event.orders?.display_id && (
                    <div className={`text-[9px] font-bold mb-1 uppercase tracking-wider flex items-center gap-1 ${isAdmin ? 'text-white/70' : 'text-[var(--primary)]'}`}>
                      <span className="material-symbols-outlined sz-10">link</span>
                      Order {event.orders.display_id}
                    </div>
                  )}
                  {event.file_url && (
                    <img src={event.file_url} alt="attachment" className="rounded-lg mb-2 max-w-full h-auto border border-black/10" />
                  )}
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* --- BOTTOM ACTION BAR --- */}
      <div className="absolute bottom-0 left-0 w-full bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-30">
        
        {/* Context Linker (Active Orders) */}
        {activeOrders.length > 0 && (
          <div className="flex overflow-x-auto px-4 py-2 gap-2 no-scrollbar border-b border-[var(--border)] bg-[var(--surface-2)]/50">
            <span className="text-[10px] font-bold text-[var(--text-3)] flex items-center pr-1 uppercase tracking-wider">Link:</span>
            <button 
              onClick={() => setSelectedOrderId(null)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedOrderId === null ? 'bg-[var(--text)] text-[var(--bg)]' : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)]'}`}
            >
              General
            </button>
            {activeOrders.map(o => (
              <button 
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedOrderId === o.id ? 'bg-[var(--primary)] text-white shadow-md shadow-primary/20' : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)]'}`}
              >
                <span className="material-symbols-outlined sz-14">receipt_long</span>
                {o.display_id || `#${o.id.substring(0,4).toUpperCase()}`}
              </button>
            ))}
          </div>
        )}

        {/* Input Row */}
        <div className="flex items-end gap-2 px-4 py-3 relative">
          
          {/* Action Menu Toggle */}
          <button 
            onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${isActionMenuOpen ? 'bg-[var(--text)] text-[var(--surface)] rotate-45' : 'bg-[var(--surface-3)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white'}`}
          >
            <span className="material-symbols-outlined sz-24">add</span>
          </button>

          {/* Action Pop-up Menu */}
          {isActionMenuOpen && (
            <div className="absolute bottom-[70px] left-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-2 flex flex-col gap-1 w-56 animate-slide-up origin-bottom-left">
              
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-3 w-full hover:bg-[var(--surface-2)] rounded-xl text-left transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><span className="material-symbols-outlined sz-18">photo_camera</span></div>
                <div><p className="text-sm font-bold text-[var(--text)]">Camera / Photo</p><p className="text-[10px] text-[var(--text-2)]">Upload file to timeline</p></div>
              </button>
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

              <button onClick={() => { setIsActionMenuOpen(false); setPaymentModal(true); }} className="flex items-center gap-3 px-3 py-3 w-full hover:bg-[var(--surface-2)] rounded-xl text-left transition-colors">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><span className="material-symbols-outlined sz-18">payments</span></div>
                <div><p className="text-sm font-bold text-[var(--text)]">Receive Payment</p><p className="text-[10px] text-[var(--text-2)]">Log incoming money</p></div>
              </button>

              <button onClick={() => { setIsActionMenuOpen(false); setStatusModal(true); }} className="flex items-center gap-3 px-3 py-3 w-full hover:bg-[var(--surface-2)] rounded-xl text-left transition-colors">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><span className="material-symbols-outlined sz-18">update</span></div>
                <div><p className="text-sm font-bold text-[var(--text)]">Update Status</p><p className="text-[10px] text-[var(--text-2)]">Change order progress</p></div>
              </button>

            </div>
          )}

          {/* Text Input */}
          <div className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-3xl flex items-center px-4 py-1 shadow-inner focus-within:ring-2 ring-[var(--primary)]/20 transition-all">
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Message or note..."
              className="w-full bg-transparent border-none focus:outline-none text-sm py-2.5 text-[var(--text)] placeholder-[var(--text-3)] font-medium"
            />
          </div>

          {/* Send Button */}
          <button 
            onClick={handleSendMessage}
            disabled={!message.trim() || isSubmitting}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white transition-all shadow-md ${message.trim() ? 'bg-[var(--primary)] scale-100 active:scale-90' : 'bg-[var(--border)] scale-95 opacity-50 cursor-not-allowed'}`}
          >
            {isSubmitting && message.trim() ? <div className="vp-spinner-sm border-white/30 border-t-white"></div> : <span className="material-symbols-outlined sz-20 ml-1">send</span>}
          </button>
        </div>
      </div>

      {/* --- DRAWER (Right Side Customer Profile) --- */}
      {isDrawerOpen && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-[85%] max-w-md h-full bg-[var(--surface)] shadow-2xl animate-slide-in-right flex flex-col">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-2)]">
              <h3 className="font-display font-bold text-xl text-[var(--text)] tracking-tight">Client Profile</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--text)]">
                <span className="material-symbols-outlined sz-20">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Profile Card */}
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-2)] flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-primary/20 mb-4">
                  {customer?.full_name?.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold text-[var(--text)]">{customer?.full_name}</h2>
                <p className="text-[var(--text-2)] font-medium mt-1 bg-[var(--surface-2)] px-3 py-1 rounded-full inline-flex items-center gap-2 border border-[var(--border)]">
                  <span className="material-symbols-outlined sz-16">storefront</span>
                  {clientData?.business_name || "Personal Account"}
                </p>
                <p className="text-[var(--text-3)] font-mono text-sm mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined sz-14">call</span> {customer?.phone_number}
                </p>
              </div>

              {/* Financial Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-4 border-l-4 border-l-[#EF4444]">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-3)] tracking-wider">Total Due</p>
                  <p className="text-xl font-black text-[#EF4444] mt-1">₹{dues.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4 border-l-4 border-l-[var(--primary)]">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-3)] tracking-wider">Total Orders</p>
                  <p className="text-xl font-black text-[var(--text)] mt-1">{orders.length}</p>
                </div>
              </div>

              {/* Active Orders List */}
              {activeOrders.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-2)] uppercase tracking-wider mb-3">Active Jobs</h4>
                  <div className="space-y-2">
                    {activeOrders.map(o => (
                      <div key={o.id} className="glass-card p-3 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-[var(--primary)] font-mono text-sm">{o.display_id || `#${o.id.substring(0,4).toUpperCase()}`}</p>
                          <p className="text-xs text-[var(--text-2)]">{o.order_items?.[0]?.custom_service_name || 'Custom Print Job'}</p>
                        </div>
                        <span className="bg-[var(--surface-2)] border border-[var(--border)] text-[10px] font-bold px-2 py-1 rounded-md">
                          {o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* 1. Receive Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl flex items-center gap-2"><span className="material-symbols-outlined text-[#10B981]">payments</span> Record Payment</h3>
              <button onClick={() => setPaymentModal(false)} className="text-[var(--text-3)]"><span className="material-symbols-outlined">close</span></button>
            </div>
            {dues > 0 && <p className="text-sm font-bold text-[#EF4444] mb-4 bg-red-50 p-2 rounded-lg">Current Due: ₹{dues.toLocaleString()}</p>}
            <form onSubmit={handleReceivePayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-2)] uppercase tracking-wider pl-1">Amount (₹)</label>
                <input type="number" autoFocus required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="vp-input mt-1 text-lg font-mono font-bold" placeholder="0.00" />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-success w-full justify-center h-12 text-base shadow-lg shadow-emerald-500/20">
                {isSubmitting ? "Processing..." : "Confirm Payment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Update Status Modal */}
      {statusModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl flex items-center gap-2"><span className="material-symbols-outlined text-orange-500">update</span> Update Status</h3>
              <button onClick={() => setStatusModal(false)} className="text-[var(--text-3)]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleUpdateStatus} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-[var(--text-2)] uppercase tracking-wider pl-1">Select Order</label>
                <select required value={statusOrderId} onChange={(e) => setStatusOrderId(e.target.value)} className="vp-input mt-1 font-medium">
                  <option value="" disabled>Choose an order...</option>
                  {activeOrders.map(o => <option key={o.id} value={o.id}>{o.display_id || o.id.substring(0,6)} - {o.order_items?.[0]?.custom_service_name || 'Job'}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-2)] uppercase tracking-wider pl-1">New Status</label>
                <select required value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="vp-input mt-1 font-medium">
                  <option value="Designing">🎨 Designing</option>
                  <option value="Processing">⚙️ Processing / Printing</option>
                  <option value="Ready">✅ Ready for Pickup</option>
                  <option value="Delivered">📦 Delivered</option>
                </select>
              </div>
              <button type="submit" disabled={isSubmitting || !statusOrderId} className="btn-primary w-full justify-center h-12 text-base">
                {isSubmitting ? "Updating..." : "Save Status"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}