"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { getCustomerHub, addTimelineEvent } from "../../actions/timeline";

export default function CustomerWhatsAppHub() {
  const params = useParams();
  const customerId = params.id as string;
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState("Admin");

  // UI States
  const [message, setMessage] = useState("");
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        if (p) setCurrentUser(p.full_name.split(" ")[0]);
      }
    }
    loadUser();
    fetchHubData();
  }, [customerId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline, showPaymentInput, isAttachmentOpen]);

  async function fetchHubData() {
    const res = await getCustomerHub(customerId);
    if (res.success) {
      setProfile(res.profile);
      setTimeline(res.timeline);
      setAllOrders(res.orders);
    }
    setLoading(false);
  }

  // --- NATIVE, ZERO-CRASH CANVAS COMPRESSOR ---
  const compressImageNatively = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], `upload-${Date.now()}.webp`, { type: "image/webp" }));
          else reject("Canvas compression failed");
        }, "image/webp", 0.7);
      };
      img.onerror = (e) => reject(e);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAttachmentOpen(false);
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      const compressedFile = await compressImageNatively(file);
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", "vidya_uploads");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      
      await addTimelineEvent({
        customerId, orderId: selectedOrderId || null,
        eventType: "Attachment", description: message || "Uploaded a document/image.", fileUrl: data.secure_url,
        authorName: currentUser
      });
      setMessage("");
      fetchHubData();
    } catch (error) {
      alert("Image upload failed. Please try again.");
    }
    setIsSending(false);
  };

  const handleSendMessage = async (e?: React.FormEvent, quickMessage?: string) => {
    if (e) e.preventDefault();
    const finalMessage = quickMessage || message;
    
    if (!finalMessage && !showPaymentInput) return;
    if (showPaymentInput && !paymentAmount) return alert("Enter payment amount");

    setIsSending(true);
    const eventType = showPaymentInput ? "Payment" : "Note";
    const desc = showPaymentInput ? `Payment of ₹${paymentAmount}. ${finalMessage}` : finalMessage;

    await addTimelineEvent({
      customerId, orderId: selectedOrderId || null,
      eventType, description: desc, amount: Number(paymentAmount) || 0,
      authorName: currentUser
    });

    setMessage(""); setPaymentAmount(""); setShowPaymentInput(false); setSelectedOrderId(""); setIsAttachmentOpen(false);
    fetchHubData();
    setIsSending(false);
  };

  const handleWhatsAppForward = (event: any) => {
    if (!profile?.phone_number) return alert("Customer has no phone number saved.");
    let phone = profile.phone_number.replace(/\D/g, '');
    if (phone.length === 10) phone = `91${phone}`;

    let waText = `Dear ${profile.full_name},\n\n`;
    if (event.event_type === 'Payment') waText += `We have successfully received your payment of *₹${event.amount}*.\n`;
    else if (event.event_type === 'Status_Change') waText += `Update on your order: *${event.description}*\n\n`;
    else waText += `${event.description}\n\n`;
    waText += `Regards,\n*Vidya Printers*`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`, '_blank');
  };

  const sendQuickWhatsApp = (type: "Reminder" | "Approval") => {
    if (!profile?.phone_number) return alert("No phone number saved.");
    let phone = profile.phone_number.replace(/\D/g, '');
    if (phone.length === 10) phone = `91${phone}`;

    let waText = `Dear ${profile.full_name},\n\n`;
    if (type === "Reminder") waText += `This is a gentle reminder regarding your pending dues of *₹${profile?.clients_data?.[0]?.total_dues}*. Please clear the payment at your earliest convenience.\n\n`;
    if (type === "Approval") waText += `We have prepared the design for your order. Kindly review and approve it so we can proceed with printing.\n\n`;
    
    waText += `Regards,\n*Vidya Printers*`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`, '_blank');
  };

  // --- Smart Date Grouping Logic ---
  const groupTimelineByDate = () => {
    const groups: { [key: string]: any[] } = {};
    timeline.forEach(event => {
      const dateObj = new Date(event.created_at);
      const today = new Date();
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      if (dateObj.toDateString() === today.toDateString()) dateKey = "Today";
      else if (dateObj.toDateString() === yesterday.toDateString()) dateKey = "Yesterday";

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#efeae2] dark:bg-[#0b141a]"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>;

  const totalDues = profile?.clients_data?.[0]?.total_dues || 0;
  const activeOrdersList = allOrders.filter(o => o.status !== "Collected" && o.status !== "Delivered");
  const pastOrdersList = allOrders.filter(o => o.status === "Collected" || o.status === "Delivered");
  const groupedTimeline = groupTimelineByDate();

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen w-full bg-[#efeae2] dark:bg-[#0b141a] relative overflow-hidden">
      
      {/* Lightbox */}
      {expandedImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setExpandedImage(null)} className="p-2 text-white hover:bg-white/20 rounded-full"><span className="material-symbols-outlined text-3xl">close</span></button>
            <a href={expandedImage} download target="_blank" rel="noreferrer" className="p-2 text-white hover:bg-white/20 rounded-full"><span className="material-symbols-outlined text-2xl">download</span></a>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2" onClick={() => setExpandedImage(null)}>
            <img src={expandedImage} alt="Expanded" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* --- PROFILE & ORDERS DRAWER (Slide in from Right/Bottom) --- */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowProfileDrawer(false)}>
          <div className="w-full md:w-96 bg-bg-main h-full shadow-2xl flex flex-col animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
            <div className="bg-surface p-4 flex items-center gap-4 border-b border-border-subtle">
              <button onClick={() => setShowProfileDrawer(false)} className="text-text-main"><span className="material-symbols-outlined">close</span></button>
              <h2 className="font-bold text-text-main text-lg">Customer Info</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              <div className="bg-surface p-5 rounded-2xl border border-border-subtle text-center shadow-sm">
                <div className="h-20 w-20 mx-auto bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-black mb-3">{profile?.full_name.substring(0, 2).toUpperCase()}</div>
                <h3 className="font-black text-text-main text-xl">{profile?.full_name}</h3>
                <p className="text-text-sub font-medium">{profile?.phone_number}</p>
                <div className="mt-4 p-4 rounded-xl bg-bg-main border border-border-subtle flex justify-between items-center">
                  <span className="font-bold text-text-sub uppercase tracking-wider text-xs">Total Dues</span>
                  <span className={`font-black text-xl ${totalDues > 0 ? 'text-danger' : 'text-success'}`}>₹{totalDues}</span>
                </div>
              </div>

              <div>
                <h4 className="font-black text-text-main mb-3 uppercase tracking-wider text-xs px-1">Active Orders ({activeOrdersList.length})</h4>
                <div className="space-y-2">
                  {activeOrdersList.map(o => (
                    <Link href={`/orders/${o.id}`} key={o.id} className="flex flex-col bg-surface p-3 rounded-xl border border-border-subtle hover:border-primary transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-text-main">#{o.display_id || o.id.split('-')[0]}</span>
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase">{o.status}</span>
                      </div>
                      <p className="text-xs text-text-sub truncate">{o.order_items?.[0]?.custom_service_name}</p>
                    </Link>
                  ))}
                  {activeOrdersList.length === 0 && <p className="text-sm text-text-sub italic px-1">No active orders.</p>}
                </div>
              </div>

              <div>
                <h4 className="font-black text-text-main mb-3 uppercase tracking-wider text-xs px-1">Past Orders</h4>
                <div className="space-y-2 opacity-80">
                  {pastOrdersList.map(o => (
                    <Link href={`/orders/${o.id}`} key={o.id} className="flex justify-between items-center bg-surface p-3 rounded-xl border border-border-subtle hover:border-primary transition-colors">
                      <div>
                        <span className="font-bold text-sm text-text-main block">#{o.display_id || o.id.split('-')[0]}</span>
                        <span className="text-xs text-text-sub">{new Date(o.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="font-bold text-success text-sm">₹{o.total_amount}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- WHATSAPP HEADER --- */}
      <div className="flex items-center px-2 py-2 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-border-subtle shrink-0 shadow-sm z-20 cursor-pointer" onClick={() => setShowProfileDrawer(true)}>
        <Link href="/customers" onClick={e => e.stopPropagation()} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center text-text-sub dark:text-[#8696a0]">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        
        <div className="flex items-center gap-3 flex-1 min-w-0 px-1">
          <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-white font-bold shrink-0">
            <span className="material-symbols-outlined text-2xl">person</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h2 className="font-bold text-text-main dark:text-[#e9edef] text-base truncate leading-tight flex items-center gap-2">
              {profile?.full_name}
              {totalDues > 0 && <span className="bg-danger text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shadow-sm">Dues: ₹{totalDues}</span>}
            </h2>
            <p className="text-xs text-text-sub dark:text-[#8696a0] truncate mt-0.5">
              Tap here for info & orders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-text-sub dark:text-[#8696a0]">
          <a href={`tel:${profile?.phone_number}`} onClick={e => e.stopPropagation()} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[22px]">call</span>
          </a>
        </div>
      </div>

      {/* --- TIMELINE CHAT AREA --- */}
      <div className="flex-1 overflow-y-auto px-2 md:px-4 py-4 relative scrollbar-hide" style={{ backgroundImage: `url('https://tzaxthrqwfgbrcqmtuec.supabase.co/storage/v1/object/public/images/whatsapp-bg.png')`, backgroundSize: 'cover', backgroundAttachment: 'fixed', opacity: 0.9 }}>
        <div className="flex flex-col gap-2.5 relative z-10 max-w-3xl mx-auto">
          
          {Object.keys(groupedTimeline).map(dateKey => (
            <div key={dateKey} className="contents">
              
              {/* SMART DATE DIVIDER */}
              <div className="flex justify-center my-2">
                <span className="bg-[#ffeecd] dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
                  {dateKey}
                </span>
              </div>

              {/* MESSAGES FOR THIS DATE */}
              {groupedTimeline[dateKey].map((event) => {
                const isMe = event.author_name === currentUser;
                const isPayment = event.event_type === 'Payment';
                const isSystem = event.event_type === 'Status_Change';
                const orderLinkStr = event.orders?.display_id ? `#${event.orders.display_id}` : "Order Link";

                if (isSystem) {
                  return (
                    <div key={event.id} className="flex justify-center my-1 group relative">
                      <span className="bg-surface/90 dark:bg-[#182229]/90 backdrop-blur-sm text-text-sub dark:text-[#8696a0] text-[10px] font-bold px-3 py-1 rounded-full border border-border-subtle shadow-sm uppercase tracking-wider flex items-center gap-2">
                        {event.description}
                        <button onClick={() => handleWhatsAppForward(event)} className="text-emerald-500 hover:text-emerald-600 ml-1"><i className="material-symbols-outlined text-[14px]">send_to_mobile</i></button>
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={event.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                    
                    <div className={`hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-opacity px-2 ${isMe ? 'order-1' : 'order-2'}`}>
                      <button onClick={() => handleWhatsAppForward(event)} className="p-1.5 bg-surface rounded-full shadow-sm text-[#00a884] hover:bg-[#d9fdd3]" title="Forward to WhatsApp">
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                      </button>
                    </div>

                    <div className={`flex flex-col max-w-[88%] md:max-w-[65%] rounded-2xl px-2.5 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative ${isMe ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none' : 'bg-white dark:bg-[#202c33] rounded-tl-none'}`}>
                      
                      {!isMe && (
                        <span className="text-[11px] font-black text-[#eb5a46] dark:text-[#53bdeb] mb-0.5 leading-tight">
                          ~ {event.author_name}
                        </span>
                      )}

                      {event.order_id && (
                        <Link href={`/orders/${event.order_id}`} className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 hover:bg-primary/10 transition-colors px-2 py-0.5 rounded-md text-[10px] font-black text-primary dark:text-[#53bdeb] w-fit mb-1 border-l-2 border-primary">
                          <span className="material-symbols-outlined text-[12px]">link</span> {orderLinkStr}
                        </Link>
                      )}

                      {event.file_url && (
                        <div onClick={() => setExpandedImage(event.file_url)} className="mt-1 mb-1 rounded-xl overflow-hidden bg-black/5 relative cursor-zoom-in group/img border border-black/5">
                          <img src={event.file_url} alt="attachment" className="w-full h-auto max-h-64 object-cover" />
                        </div>
                      )}

                      {isPayment && (
                        <div className="flex items-center gap-1.5 mb-1 text-success dark:text-[#00a884] font-black text-xl">
                          <span className="material-symbols-outlined">payments</span> ₹{event.amount}
                        </div>
                      )}

                      <div className="flex flex-wrap items-end justify-between gap-2">
                        <p className="text-[14px] text-[#111b21] dark:text-[#e9edef] leading-snug break-words whitespace-pre-wrap">{event.description}</p>
                        <div className="flex items-center gap-1 mt-1 ml-auto">
                          <button onClick={() => handleWhatsAppForward(event)} className="md:hidden text-[#8696a0] hover:text-[#00a884]"><span className="material-symbols-outlined text-[14px]">send_to_mobile</span></button>
                          <span className="text-[10px] text-[#667781] dark:text-[#8696a0] font-medium tracking-tight">
                            {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && <span className="material-symbols-outlined text-[14px] text-[#53bdeb] ml-1 align-middle -mt-0.5">done_all</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {isSending && (
            <div className="flex w-full justify-end">
               <div className="bg-[#d9fdd3] dark:bg-[#005c4b] rounded-2xl rounded-tr-none px-4 py-2 shadow-sm text-[#667781] dark:text-[#8696a0] text-sm flex items-center gap-2 font-bold">
                 <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> Sending...
               </div>
            </div>
          )}
          <div ref={chatEndRef} className="h-4"></div>
        </div>
      </div>

      {/* --- QUICK REPLY CHIPS --- */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-2 pt-2 flex gap-2 overflow-x-auto scrollbar-hide z-30">
        <button onClick={() => sendQuickWhatsApp("Reminder")} className="shrink-0 flex items-center gap-1 bg-white dark:bg-[#2a3942] border border-border-subtle rounded-full px-3 py-1.5 text-xs font-bold text-text-main shadow-sm hover:border-primary">
           <span className="material-symbols-outlined text-[14px] text-danger">notifications_active</span> Dues Reminder
        </button>
        <button onClick={() => sendQuickWhatsApp("Approval")} className="shrink-0 flex items-center gap-1 bg-white dark:bg-[#2a3942] border border-border-subtle rounded-full px-3 py-1.5 text-xs font-bold text-text-main shadow-sm hover:border-primary">
           <span className="material-symbols-outlined text-[14px] text-primary">draw</span> Request Approval
        </button>
      </div>

      {/* --- WHATSAPP INPUT FOOTER --- */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-2 py-2 shrink-0 relative z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        
        {isAttachmentOpen && (
          <div className="absolute bottom-[65px] left-4 bg-white dark:bg-[#233138] rounded-3xl shadow-2xl border border-border-subtle p-5 grid grid-cols-4 gap-6 w-[calc(100%-32px)] max-w-sm animate-in slide-in-from-bottom-2">
            <label className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="h-14 w-14 rounded-full bg-gradient-to-b from-[#bf59cf] to-[#9d31ac] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"><span className="material-symbols-outlined text-2xl">image</span></div>
              <span className="text-xs font-medium text-text-main dark:text-[#e9edef]">Gallery</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <label className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="h-14 w-14 rounded-full bg-gradient-to-b from-[#d3396d] to-[#d8195a] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"><span className="material-symbols-outlined text-2xl">camera_alt</span></div>
              <span className="text-xs font-medium text-text-main dark:text-[#e9edef]">Camera</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
            </label>
            <button type="button" onClick={() => { setShowPaymentInput(true); setIsAttachmentOpen(false); }} className="flex flex-col items-center gap-2 group">
              <div className="h-14 w-14 rounded-full bg-gradient-to-b from-[#00a884] to-[#008f6f] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"><span className="material-symbols-outlined text-2xl">currency_rupee</span></div>
              <span className="text-xs font-medium text-text-main dark:text-[#e9edef]">Payment</span>
            </button>
            <button type="button" onClick={() => setIsAttachmentOpen(false)} className="flex flex-col items-center gap-2 group">
              <div className="h-14 w-14 rounded-full bg-gradient-to-b from-[#0eabf4] to-[#0980ca] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"><span className="material-symbols-outlined text-2xl">description</span></div>
              <span className="text-xs font-medium text-text-main dark:text-[#e9edef]">Document</span>
            </button>
          </div>
        )}

        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          {(showPaymentInput || message.length > 0) && activeOrdersList.length > 0 && (
             <div className="flex items-center px-1">
               <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} className="w-fit bg-white dark:bg-[#2a3942] border border-border-subtle text-xs font-bold text-text-main dark:text-[#e9edef] rounded-full px-3 py-1.5 outline-none shadow-sm focus:ring-2 ring-primary">
                 <option value="">🔗 Link to a specific order?</option>
                 {activeOrdersList.map(o => <option key={o.id} value={o.id}>Ord {o.display_id || o.id.split('-')[0]} (Due: ₹{o.total_amount - o.amount_paid})</option>)}
               </select>
             </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative">
            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-3xl flex flex-col overflow-hidden shadow-sm border border-border-subtle/50">
              {showPaymentInput && (
                <div className="flex items-center bg-[#d9fdd3]/30 dark:bg-[#005c4b]/30 px-3 py-2 border-b border-[#d9fdd3] dark:border-[#005c4b]">
                  <span className="material-symbols-outlined text-success dark:text-[#00a884] text-[20px]">payments</span>
                  <input type="number" autoFocus required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Amount received..." className="flex-1 bg-transparent border-none focus:ring-0 text-text-main dark:text-[#e9edef] font-black text-lg outline-none px-2" />
                  <button type="button" onClick={() => setShowPaymentInput(false)} className="text-text-sub bg-black/5 rounded-full p-1"><span className="material-symbols-outlined text-[16px]">close</span></button>
                </div>
              )}
              <div className="flex items-end px-1 py-1 min-h-[48px]">
                <button type="button" className="p-2.5 text-text-sub dark:text-[#8696a0] hover:text-text-main shrink-0">
                  <span className="material-symbols-outlined text-[24px]">sentiment_satisfied</span>
                </button>
                <textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder={showPaymentInput ? "Add a payment note..." : "Message"} 
                  className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 py-3 px-1 text-[15px] text-text-main dark:text-[#e9edef] placeholder:text-text-sub dark:placeholder-[#8696a0] leading-tight"
                  rows={1}
                />
                <button type="button" onClick={() => setIsAttachmentOpen(!isAttachmentOpen)} className={`p-2.5 shrink-0 transition-colors ${isAttachmentOpen ? 'text-primary' : 'text-text-sub dark:text-[#8696a0]'}`}>
                  <span className="material-symbols-outlined text-[24px] origin-center -rotate-45">attach_file</span>
                </button>
                {!message && !showPaymentInput && (
                  <label className="p-2.5 text-text-sub dark:text-[#8696a0] cursor-pointer shrink-0">
                    <span className="material-symbols-outlined text-[24px]">camera_alt</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <button type="submit" disabled={isSending || (!message && !showPaymentInput)} className="h-[48px] w-[48px] rounded-full bg-[#00a884] flex items-center justify-center shrink-0 shadow-md text-white hover:bg-[#008f6f] transition-colors disabled:opacity-50 disabled:bg-[#00a884]/50">
              <span className="material-symbols-outlined text-[24px] ml-1">{message || showPaymentInput ? 'send' : 'mic'}</span>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}