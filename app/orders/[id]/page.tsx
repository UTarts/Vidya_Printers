"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { getOrderHub, updateOrderStatus, logManualMaterial } from "../../actions/order-hub";
import { addTimelineEvent } from "../../actions/timeline";

export default function OrderWhatsAppHub() {
  const params = useParams();
  const orderId = params.id as string;
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline"); // 'timeline' or 'materials'
  const [currentUser, setCurrentUser] = useState("Admin");

  // Data States
  const [order, setOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [materialsUsed, setMaterialsUsed] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);

  // Action States
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  
  // Material States
  const [selectedInventory, setSelectedInventory] = useState("");
  const [materialQty, setMaterialQty] = useState("");
  const [isWaste, setIsWaste] = useState(false);
  const [wasteReason, setWasteReason] = useState("");
  const [loggingMaterial, setLoggingMaterial] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        if (p) setCurrentUser(p.full_name.split(" ")[0]);
      }
    }
    loadUser();
    fetchData();
  }, [orderId]);

  useEffect(() => {
    if (activeTab === "timeline") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline, activeTab]);

  async function fetchData() {
    const res = await getOrderHub(orderId);
    if (res.success) {
      setOrder(res.order);
      setTimeline(res.timeline);
      setMaterialsUsed(res.materialsUsed);
      setInventoryList(res.inventoryList);
    }
    setLoading(false);
  }

  // --- NATIVE CANVAS COMPRESSOR (Zero Mobile Crashes) ---
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
          if (blob) resolve(new File([blob], `proof-${Date.now()}.webp`, { type: "image/webp" }));
          else reject("Compression failed");
        }, "image/webp", 0.8);
      };
      img.onerror = (e) => reject(e);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        customerId: order.client_id, orderId: order.id,
        eventType: "Attachment", description: message || "Uploaded a production proof.", fileUrl: data.secure_url,
        authorName: currentUser
      });
      setMessage("");
      fetchData();
    } catch (error) {
      alert("Image upload failed. Try again.");
    }
    setIsSending(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    setIsSending(true);

    await addTimelineEvent({
      customerId: order.client_id, orderId: order.id,
      eventType: "Note", description: message, authorName: currentUser
    });

    setMessage("");
    fetchData();
    setIsSending(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    await updateOrderStatus(orderId, order.client_id, newStatus);
    await addTimelineEvent({
      customerId: order.client_id, orderId: order.id,
      eventType: "Status_Change", description: `Order status updated to: ${newStatus}`, authorName: currentUser
    });
    fetchData();
    setStatusLoading(false);
  };

  const handleLogMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory || !materialQty) return;
    setLoggingMaterial(true);
    
    await logManualMaterial(orderId, selectedInventory, Number(materialQty));
    
    if (isWaste) {
      await addTimelineEvent({
        customerId: order.client_id, orderId: order.id,
        eventType: "Note", description: `Logged Waste: ${materialQty} units. Reason: ${wasteReason || 'Machine Error'}`, authorName: currentUser
      });
    }

    setSelectedInventory(""); setMaterialQty(""); setIsWaste(false); setWasteReason("");
    fetchData();
    setLoggingMaterial(false);
  };

  const handleWhatsAppForward = (event: any) => {
    if (!order?.profiles?.phone_number) return alert("Customer has no phone number saved.");
    let phone = order.profiles.phone_number.replace(/\D/g, '');
    if (phone.length === 10) phone = `91${phone}`;

    let waText = `Dear ${order.profiles.full_name},\n\nUpdate on your Order *#${order.display_id || order.id.split('-')[0]}*:\n\n`;
    if (event.event_type === 'Status_Change') waText += `Status: *${event.description.replace('Order status updated to: ', '')}*\n\n`;
    else waText += `${event.description}\n\n`;
    waText += `Regards,\n*Vidya Printers*`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`, '_blank');
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-bg-main"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>;

  const orderTitle = order?.order_items?.[0]?.custom_service_name || "Custom Order";
  const displayId = order?.display_id || order?.id.split('-')[0];

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen w-full bg-bg-main relative overflow-hidden">
      
      {/* Lightbox */}
      {expandedImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <button onClick={() => setExpandedImage(null)} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"><span className="material-symbols-outlined text-3xl">close</span></button>
            <a href={expandedImage} download target="_blank" rel="noreferrer" className="p-2 text-white hover:bg-white/20 rounded-full transition-colors flex items-center gap-2"><span className="material-symbols-outlined text-2xl">download</span></a>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2" onClick={() => setExpandedImage(null)}>
            <img src={expandedImage} alt="Expanded" className="max-w-full max-h-full object-contain cursor-zoom-out rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className="flex-none bg-surface border-b border-border-subtle z-20 sticky top-0 shadow-sm md:pt-6">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/orders" className="p-1 -ml-1 text-text-sub hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </Link>
            <div>
              <h2 className="text-lg font-black tracking-tight text-text-main truncate max-w-[180px] md:max-w-md">{orderTitle}</h2>
              <p className="text-xs font-bold text-text-sub">#{displayId} • {order?.profiles?.full_name}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <label className="text-[9px] font-black uppercase tracking-wider text-text-sub mb-0.5">Status</label>
            <select 
              value={order?.status} 
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusLoading}
              className={`text-xs font-bold px-2.5 py-1 rounded-md outline-none cursor-pointer border border-transparent focus:ring-2 ring-primary ${
                order?.status === 'Pending' ? 'bg-warning/10 text-warning border-warning/20' : 
                order?.status === 'Printing' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                order?.status === 'Ready' || order?.status === 'Collected' ? 'bg-success/10 text-success border-success/20' : 
                'bg-bg-main text-text-main border-border-subtle'
              }`}
            >
              <option value="Draft">Draft (Quote)</option>
              <option value="Pending">Pending / Designing</option>
              <option value="Printing">Printing in Progress</option>
              <option value="Ready">Ready for Pickup</option>
              <option value="Collected">Collected & Done</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex w-full px-2 mt-1">
          <button onClick={() => setActiveTab("timeline")} className={`flex-1 text-center py-3 border-b-2 font-bold text-sm transition-colors ${activeTab === "timeline" ? "border-primary text-primary" : "border-transparent text-text-sub hover:text-text-main"}`}>
            Production Chat
          </button>
          <button onClick={() => setActiveTab("materials")} className={`flex-1 text-center py-3 border-b-2 font-bold text-sm transition-colors flex items-center justify-center gap-1.5 ${activeTab === "materials" ? "border-primary text-primary" : "border-transparent text-text-sub hover:text-text-main"}`}>
            <span className="material-symbols-outlined text-[16px]">inventory_2</span> Log Material
          </button>
        </div>
      </header>

      {/* --- TAB CONTENT: TIMELINE CHAT --- */}
      {activeTab === "timeline" && (
        <>
          <main className="flex-1 overflow-y-auto px-2 md:px-4 py-4 space-y-4 scrollbar-hide relative" style={{ backgroundImage: `url('https://tzaxthrqwfgbrcqmtuec.supabase.co/storage/v1/object/public/images/whatsapp-bg.png')`, backgroundSize: 'cover', backgroundAttachment: 'fixed', opacity: 0.9 }}>
            <div className="flex justify-center sticky top-2 z-10">
              <span className="bg-surface border border-border-subtle text-text-sub text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                Order Logged • {new Date(order?.created_at).toLocaleDateString()}
              </span>
            </div>

            {timeline.map((event) => {
              const isMe = event.author_name === currentUser;
              const isSystem = event.event_type === 'Status_Change';

              if (isSystem) {
                return (
                  <div key={event.id} className="flex justify-center my-3 group relative">
                    <span className="bg-surface/90 backdrop-blur-sm text-text-main text-[11px] font-black px-4 py-2 rounded-full border border-border-subtle shadow-sm uppercase tracking-wider flex items-center gap-2">
                      {event.description}
                      <button onClick={() => handleWhatsAppForward(event)} className="text-[#00a884] hover:text-[#008f6f] ml-1 flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded-full"><i className="material-symbols-outlined text-[14px]">send_to_mobile</i> Inform Client</button>
                    </span>
                  </div>
                );
              }

              return (
                <div key={event.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                  <div className={`hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-opacity px-2 ${isMe ? 'order-1' : 'order-2'}`}>
                    <button onClick={() => handleWhatsAppForward(event)} className="p-1.5 bg-surface rounded-full shadow-sm text-[#00a884] hover:bg-[#d9fdd3]" title="Forward to Client">
                      <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
                    </button>
                  </div>

                  <div className={`flex flex-col max-w-[88%] md:max-w-[65%] rounded-2xl px-2.5 py-2 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative ${isMe ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none' : 'bg-white dark:bg-[#202c33] rounded-tl-none'}`}>
                    {!isMe && <span className="text-[11px] font-black text-[#eb5a46] dark:text-[#53bdeb] mb-1 leading-tight">~ {event.author_name}</span>}

                    {event.file_url && (
                      <div onClick={() => setExpandedImage(event.file_url)} className="mt-1 mb-1.5 rounded-xl overflow-hidden bg-black/5 relative cursor-zoom-in group/img shadow-sm border border-black/5">
                        <img src={event.file_url} alt="attachment" className="w-full h-auto max-h-64 object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="material-symbols-outlined text-white opacity-0 group-hover/img:opacity-100 drop-shadow-md text-3xl">zoom_in</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <p className="text-[14px] text-[#111b21] dark:text-[#e9edef] leading-snug break-words whitespace-pre-wrap">{event.description}</p>
                      <div className="flex items-center gap-1 mt-1 ml-auto">
                        <button onClick={() => handleWhatsAppForward(event)} className="md:hidden text-[#8696a0] hover:text-[#00a884]"><span className="material-symbols-outlined text-[12px]">send_to_mobile</span></button>
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
            <div ref={chatEndRef} className="h-4"></div>
          </main>

          {/* Chat Input Bar */}
          <footer className="flex-none bg-[#f0f2f5] dark:bg-[#202c33] border-t border-border-subtle p-2 pb-safe z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-end gap-2">
              <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-3xl flex items-end px-2 py-1 min-h-[48px] shadow-sm border border-border-subtle/50">
                <button type="button" className="p-2.5 text-text-sub hover:text-text-main shrink-0"><span className="material-symbols-outlined text-[24px]">sentiment_satisfied</span></button>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type an update..." className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 py-3 px-1 text-[15px] text-text-main placeholder:text-text-sub leading-tight" rows={1} />
                <label className="p-2.5 text-text-sub cursor-pointer shrink-0 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[24px]">camera_alt</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <button type="submit" disabled={isSending || !message} className="h-[48px] w-[48px] rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:bg-primary/50">
                {isSending ? <span className="material-symbols-outlined animate-spin text-[24px]">refresh</span> : <span className="material-symbols-outlined text-[24px] ml-1">send</span>}
              </button>
            </form>
          </footer>
        </>
      )}

      {/* --- TAB CONTENT: MATERIALS LOG --- */}
      {activeTab === "materials" && (
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24 bg-bg-main">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-text-main text-2xl font-black leading-tight mb-1">Log Material Usage</h2>
              <p className="text-text-sub text-sm font-medium">Select raw materials consumed for this specific job to automatically update the factory inventory levels.</p>
            </div>

            <form onSubmit={handleLogMaterial} className="space-y-6 bg-surface p-5 rounded-2xl border border-border-subtle shadow-sm mb-8">
              <div className="space-y-2">
                <label className="text-text-main text-xs font-black uppercase tracking-widest">Material Type</label>
                <div className="relative">
                  <select required value={selectedInventory} onChange={(e) => setSelectedInventory(e.target.value)} className="w-full h-12 rounded-xl border border-border-subtle bg-bg-main text-text-main font-bold px-4 pr-10 focus:ring-2 focus:ring-primary appearance-none outline-none">
                    <option disabled value="">Select material from factory...</option>
                    {inventoryList.map(inv => <option key={inv.id} value={inv.id}>{inv.item_name} ({inv.current_stock_quantity} left)</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-text-main text-xs font-black uppercase tracking-widest">Quantity Consumed</label>
                <div className="flex items-center gap-3">
                  <input required type="number" step="0.01" value={materialQty} onChange={(e) => setMaterialQty(e.target.value)} className="flex-1 h-12 rounded-xl border border-border-subtle bg-bg-main text-text-main font-bold px-4 focus:ring-2 focus:ring-primary outline-none placeholder:text-text-sub" placeholder="e.g. 50" />
                  <div className="w-24 h-12 flex items-center justify-center rounded-xl bg-border-subtle text-text-sub font-black text-sm">Units</div>
                </div>
              </div>

              {/* Waste Toggle */}
              <div className={`p-4 rounded-xl border transition-colors ${isWaste ? 'bg-danger/5 border-danger/30' : 'bg-bg-main border-border-subtle'}`}>
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-black flex items-center gap-2 ${isWaste ? 'text-danger' : 'text-text-main'}`}>
                    <span className="material-symbols-outlined text-lg">warning</span> Report as Waste / Damage
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isWaste} onChange={() => setIsWaste(!isWaste)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-danger/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-danger"></div>
                  </label>
                </div>
                {isWaste && (
                  <div className="mt-4 animate-in slide-in-from-top-2">
                    <textarea value={wasteReason} onChange={(e) => setWasteReason(e.target.value)} required className="w-full rounded-xl border border-danger/30 bg-white dark:bg-black/20 text-text-main p-3 focus:ring-2 focus:ring-danger outline-none resize-none h-20 text-sm font-medium placeholder:text-text-sub" placeholder="Reason for waste (e.g. Machine Jam, Ink Smudge)..."></textarea>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loggingMaterial} className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-blue-600 text-white font-black transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:bg-primary/50">
                {loggingMaterial ? <span className="material-symbols-outlined animate-spin text-xl">refresh</span> : <span className="material-symbols-outlined text-xl">add_circle</span>}
                Add to Factory Log
              </button>
            </form>

            {/* Log History */}
            <div>
              <h3 className="text-text-main text-lg font-black leading-tight mb-4">Historical Usage</h3>
              <div className="space-y-3">
                {materialsUsed.length === 0 ? (
                  <p className="text-sm text-text-sub italic bg-surface p-4 rounded-xl border border-border-subtle text-center">No materials logged yet.</p>
                ) : materialsUsed.map(mat => {
                  const isWastedLog = mat.quantity_used < 0 || mat.quantity_used === "Waste"; // Depending on how you stored it, let's just assume visually
                  return (
                    <div key={mat.id} className="flex items-center p-3.5 rounded-xl bg-surface border border-border-subtle shadow-sm">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">inventory_2</span>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-main truncate">{mat.inventory?.item_name}</p>
                        <p className="text-[10px] font-medium text-text-sub mt-0.5">{new Date(mat.logged_at).toLocaleString()} • Admin</p>
                      </div>
                      <div className="text-right bg-bg-main px-3 py-1.5 rounded-lg border border-border-subtle">
                        <p className="text-sm font-black text-text-main">- {mat.quantity_used}</p>
                        <p className="text-[9px] font-bold text-text-sub uppercase tracking-wider">{mat.inventory?.unit_type}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}