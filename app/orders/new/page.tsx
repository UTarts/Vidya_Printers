"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import { getCustomers } from "../../actions/customer";
import { getServicesCatalog } from "../../actions/services";
import { createAdvancedOrder, getNextOrderId } from "../../actions/orders";

export default function NewOrderBuilder() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  // States
  const [displayId, setDisplayId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [orderType, setOrderType] = useState("Order");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [jobNotes, setJobNotes] = useState("");
  
  // File Upload State
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Line Items
  const [items, setItems] = useState([
    { id: Date.now().toString(), serviceId: "", customName: "", description: "", qty: 1, price: 0, gst: 18, isDropdownOpen: false }
  ]);

  // Drag & Drop State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      const [custRes, servRes, nextId] = await Promise.all([getCustomers(), getServicesCatalog(), getNextOrderId()]);
      if (custRes.success) setCustomers(custRes.data);
      if (servRes.success) setServices(servRes.services);
      setDisplayId(nextId);
    }
    loadData();
  }, []);

  // --- Searchable Combobox Logic ---
  const filteredCustomers = customers.filter(c => c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone_number.includes(customerSearch));
  const selectedCustomerName = customers.find(c => c.id === customerId)?.full_name || "";

  // --- Cloudinary WebP Upload ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: "image/webp" });
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", "vidya_uploads");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setAttachmentUrl(data.secure_url);
    } catch (error) {
      alert("Image upload failed. Check Cloudinary settings.");
    }
    setIsUploading(false);
  };

  // --- BUG FIX: Line Item Handlers using Functional State Updates ---
  const addLineItem = () => setItems(prev => [...prev, { id: Date.now().toString(), serviceId: "", customName: "", description: "", qty: 1, price: 0, gst: 18, isDropdownOpen: false }]);
  
  const removeLineItem = (id: string) => { 
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev); 
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // This specific handler fixes the text freezing issue by doing both updates in one batch
  const handleCustomNameChange = (id: string, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, customName: value, serviceId: "" } : item));
  };

  const selectService = (id: string, service: any) => {
    setItems(prev => prev.map(item => item.id === id ? { 
      ...item, 
      serviceId: service.id, 
      customName: service.service_name, 
      price: service.base_price, 
      gst: service.gst_rate, 
      isDropdownOpen: false 
    } : item));
  };

  // --- Drag & Drop Logic ---
  const handleDragStart = (e: React.DragEvent, index: number) => setDraggedIdx(index);
  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (draggedIdx === null || draggedIdx === index) return;
    const newItems = [...items];
    const draggedItem = newItems[draggedIdx];
    newItems.splice(draggedIdx, 1);
    newItems.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setItems(newItems);
  };
  const handleDragEnd = () => setDraggedIdx(null);

  // --- Math ---
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const totalGst = items.reduce((sum, item) => sum + ((item.qty * item.price * item.gst) / 100), 0);
  const grandTotal = subtotal + totalGst - discountAmount;
  const balanceDue = grandTotal - amountPaid;

  const handleSubmit = async (action: "Save" | "SaveAndSend") => {
    if (!customerId) return alert("Please select a customer.");
    if (items.some(i => !i.customName)) return alert("Please enter a product name for all items.");

    setLoading(true);
    const result = await createAdvancedOrder({
      displayId, customerId, orderType, discountAmount, amountPaid, attachmentUrl, jobNotes, items
    });
    
    if (result.success) {
      if (action === "SaveAndSend") alert("Order Saved! Preparing WhatsApp/Email integration...");
      router.push("/orders");
    } else {
      alert("Error saving order");
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-main font-display text-text-main min-h-screen flex flex-col overflow-x-hidden pb-10">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-surface px-4 py-3 shadow-sm border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="flex items-center justify-center p-2 rounded-full hover:bg-bg-main transition-colors">
            <span className="material-symbols-outlined text-text-main">arrow_back</span>
          </Link>
          <h2 className="text-lg font-black leading-tight">Order Builder</h2>
        </div>
        <button onClick={() => handleSubmit("Save")} className="text-sm font-bold text-text-sub hover:text-primary transition-colors bg-bg-main px-3 py-1.5 rounded-lg border border-border-subtle">
          Save as Draft
        </button>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Document Settings */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface p-4 rounded-2xl border border-border-subtle shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div>
              <label className="text-[10px] font-black text-text-sub uppercase tracking-widest">Order ID</label>
              <input type="text" value={displayId} onChange={(e) => setDisplayId(e.target.value)} className="block font-bold bg-bg-main border border-border-subtle rounded-lg px-3 py-1.5 w-32 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-text-sub uppercase tracking-widest">Date</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="block font-bold bg-bg-main border border-border-subtle rounded-lg px-3 py-1.5 focus:border-primary outline-none text-sm" />
            </div>
          </div>

          <div className="flex h-10 w-full md:w-64 items-center justify-center rounded-lg bg-bg-main border border-border-subtle p-1">
            <label className="flex cursor-pointer h-full grow items-center justify-center rounded-md px-2 transition-all has-[:checked]:bg-surface has-[:checked]:shadow-sm has-[:checked]:text-primary text-text-sub text-sm font-bold">
              <span>Quote</span>
              <input className="hidden" name="orderType" type="radio" value="Quotation" checked={orderType === 'Quotation'} onChange={(e) => setOrderType(e.target.value)}/>
            </label>
            <label className="flex cursor-pointer h-full grow items-center justify-center rounded-md px-2 transition-all has-[:checked]:bg-surface has-[:checked]:shadow-sm has-[:checked]:text-primary text-text-sub text-sm font-bold">
              <span>Order</span>
              <input className="hidden" name="orderType" type="radio" value="Order" checked={orderType === 'Order'} onChange={(e) => setOrderType(e.target.value)}/>
            </label>
          </div>
        </div>

        {/* Customer & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-5 md:p-6 rounded-2xl border border-border-subtle shadow-sm">
          
          <div className="space-y-4">
            {/* Searchable Customer Combobox */}
            <div className="relative">
              <label className="text-xs font-black text-text-main mb-1.5 block">Customer Detail</label>
              <div 
                className="w-full border border-border-subtle rounded-xl bg-bg-main flex items-center px-3 h-12 cursor-text focus-within:ring-2 ring-primary/50"
                onClick={() => setShowCustomerDropdown(true)}
              >
                <span className="material-symbols-outlined text-text-sub mr-2">search</span>
                <input 
                  type="text" 
                  value={showCustomerDropdown ? customerSearch : selectedCustomerName} 
                  onChange={(e) => setCustomerSearch(e.target.value)} 
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold outline-none" 
                  placeholder="Search customer..."
                />
              </div>

              {showCustomerDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCustomerDropdown(false)}></div>
                  <div className="absolute z-50 mt-1 w-full bg-surface border border-border-subtle rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    <button className="w-full text-left px-4 py-3 border-b border-border-subtle text-primary font-bold hover:bg-primary/5 flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-[18px]">person_add</span> Add New Customer
                    </button>
                    {filteredCustomers.map(c => (
                      <div key={c.id} onClick={() => { setCustomerId(c.id); setShowCustomerDropdown(false); setCustomerSearch(""); }} className="px-4 py-3 hover:bg-bg-main cursor-pointer border-b border-border-subtle/50 last:border-0">
                        <p className="font-bold text-text-main text-sm">{c.full_name}</p>
                        <p className="text-xs text-text-sub">{c.phone_number}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="text-xs font-black text-text-main mb-1.5 block">Job Notes</label>
              <textarea value={jobNotes} onChange={(e) => setJobNotes(e.target.value)} className="w-full border border-border-subtle rounded-xl bg-bg-main p-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none h-20" placeholder="e.g., Deliver by Friday, call before sending..."></textarea>
            </div>
          </div>

          {/* Cloudinary Image Upload */}
          <div className="flex flex-col">
            <label className="text-xs font-black text-text-main mb-1.5 block">Reference Image / File</label>
            <div className="flex-1 border-2 border-dashed border-border-subtle rounded-xl bg-bg-main flex flex-col items-center justify-center p-4 text-center group hover:border-primary transition-colors relative overflow-hidden min-h-[140px]">
              {attachmentUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src={attachmentUrl} alt="Uploaded reference" className="max-h-32 rounded-lg object-contain" />
                  <button onClick={() => setAttachmentUrl("")} className="absolute top-2 right-2 bg-danger text-white p-1 rounded-full shadow-lg">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ) : isUploading ? (
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
              ) : (
                <>
                  <div className="bg-primary/10 text-primary p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">add_a_photo</span>
                  </div>
                  <p className="text-xs font-bold text-text-sub">Tap to take photo or upload</p>
                  <p className="text-[10px] text-text-sub mt-1">Auto-compressed to WebP</p>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </>
              )}
            </div>
          </div>

        </div>

        {/* Dynamic Line Items - Desktop Row Layout */}
        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-12 gap-2 px-4 pb-2 text-[10px] font-black text-text-sub uppercase tracking-widest border-b border-border-subtle">
            <div className="col-span-6">Product / Service & Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-center">Rate</div>
            <div className="col-span-1 text-center">Tax</div>
            <div className="col-span-1 text-right">Total</div>
          </div>

          {items.map((item, index) => (
            <div 
              key={item.id} 
              draggable 
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`bg-surface border border-border-subtle rounded-2xl p-4 md:p-2 md:pl-0 shadow-sm flex flex-col md:grid md:grid-cols-12 md:gap-2 md:items-center relative ${draggedIdx === index ? 'opacity-50' : 'opacity-100'}`}
            >
              {/* Drag Handle & Delete */}
              <div className="flex justify-between md:contents mb-3 md:mb-0">
                <button className="md:hidden text-text-sub p-1">
                  <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                </button>
                <div className="hidden md:flex flex-col items-center justify-center col-span-1 pl-2 gap-2">
                  <span className="material-symbols-outlined text-text-sub cursor-grab active:cursor-grabbing hover:text-text-main text-[18px]">drag_indicator</span>
                  <button onClick={() => removeLineItem(item.id)} className="text-danger/50 hover:text-danger">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
                <button onClick={() => removeLineItem(item.id)} className="md:hidden text-danger p-1 bg-danger/10 rounded-lg">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>

              {/* Service/Name Input (Combobox) & Description */}
              <div className="md:col-span-5 flex flex-col gap-2 relative mb-3 md:mb-0">
                <div className="relative">
                  <input 
                    type="text" 
                    value={item.customName} 
                    onChange={(e) => handleCustomNameChange(item.id, e.target.value)}
                    onFocus={() => updateItem(item.id, "isDropdownOpen", true)}
                    onBlur={() => setTimeout(() => updateItem(item.id, "isDropdownOpen", false), 200)}
                    placeholder="Search service or type custom name..." 
                    className="w-full bg-bg-main border border-border-subtle rounded-xl px-3 py-2.5 text-sm font-bold text-text-main focus:ring-2 ring-primary outline-none"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-sub pointer-events-none text-[18px]">search</span>
                  
                  {item.isDropdownOpen && services.filter(s => s.service_name.toLowerCase().includes(item.customName.toLowerCase())).length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-surface border border-border-subtle rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {services.filter(s => s.service_name.toLowerCase().includes(item.customName.toLowerCase())).map(s => (
                        <div key={s.id} onClick={() => selectService(item.id, s)} className="px-3 py-2 hover:bg-bg-main cursor-pointer border-b border-border-subtle/50 text-sm font-bold">
                          {s.service_name} <span className="text-text-sub font-medium text-xs ml-1">(₹{s.base_price})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input 
                  type="text" 
                  value={item.description} 
                  onChange={(e) => updateItem(item.id, "description", e.target.value)} 
                  placeholder="Optional description (e.g. 300gsm, Matte)" 
                  className="w-full bg-transparent border-none p-0 text-xs text-text-sub focus:ring-0 outline-none px-1" 
                />
              </div>

              {/* Numbers Grid */}
              <div className="grid grid-cols-3 md:contents gap-3">
                <div className="md:col-span-2 flex flex-col md:block">
                  <label className="md:hidden text-[10px] font-bold text-text-sub uppercase mb-1">Qty</label>
                  <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))} className="w-full bg-bg-main border border-border-subtle rounded-xl px-2 py-2.5 text-center text-sm font-bold outline-none focus:ring-2 ring-primary" />
                </div>
                <div className="md:col-span-2 flex flex-col md:block">
                  <label className="md:hidden text-[10px] font-bold text-text-sub uppercase mb-1">Rate</label>
                  <input type="number" value={item.price} onChange={(e) => updateItem(item.id, "price", Number(e.target.value))} className="w-full bg-bg-main border border-border-subtle rounded-xl px-2 py-2.5 text-center text-sm font-bold outline-none focus:ring-2 ring-primary" />
                </div>
                <div className="md:col-span-1 flex flex-col md:block">
                  <label className="md:hidden text-[10px] font-bold text-text-sub uppercase mb-1">Tax</label>
                  <select value={item.gst} onChange={(e) => updateItem(item.id, "gst", Number(e.target.value))} className="w-full appearance-none bg-bg-main border border-border-subtle rounded-xl px-2 py-2.5 text-center text-sm font-bold outline-none focus:ring-2 ring-primary">
                    <option value="18">18%</option>
                    <option value="12">12%</option>
                    <option value="5">5%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 md:mt-0 pt-3 md:pt-0 border-t border-border-subtle md:border-none md:col-span-1 flex justify-between md:block md:text-right pr-2">
                <span className="md:hidden text-xs font-bold text-text-sub uppercase">Total</span>
                <span className="font-black text-text-main md:text-sm">₹{((item.qty * item.price) + ((item.qty * item.price * item.gst) / 100)).toFixed(2)}</span>
              </div>
            </div>
          ))}

          {/* Add Row Button */}
          <button onClick={addLineItem} className="w-full py-4 border-2 border-dashed border-border-subtle rounded-2xl text-primary font-bold hover:bg-primary/5 hover:border-primary transition-colors flex justify-center items-center gap-2 mt-2">
            <span className="material-symbols-outlined text-[20px]">add_circle</span> Add Another Item
          </button>
        </div>

        {/* Totals & Math Engine */}
        <section className="bg-surface rounded-3xl p-6 md:p-8 flex flex-col gap-3 shadow-xl border border-border-subtle">
          <div className="flex justify-between items-center text-sm font-bold text-text-sub">
            <span>Subtotal (Without Tax)</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold text-text-sub">
            <span>Total GST Added</span>
            <span>+ ₹{totalGst.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm font-bold text-success border-b border-border-subtle pb-4 mt-2">
            <span className="flex items-center gap-1">Discount <span className="material-symbols-outlined text-[14px]">edit</span></span>
            <div className="flex items-center bg-bg-main px-2 py-1 rounded-lg border border-success/20">
              <span>- ₹</span>
              <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} className="w-16 bg-transparent border-none p-0 text-right focus:ring-0 font-bold" />
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-2">
            <span className="text-xl font-black text-text-main">Grand Total</span>
            <span className="text-3xl font-black text-primary tracking-tight">₹{grandTotal.toFixed(2)}</span>
          </div>

          {orderType === 'Order' && (
            <div className="bg-bg-main rounded-2xl p-4 mt-4 border border-border-subtle flex items-center justify-between">
              <div>
                <label className="text-xs font-black text-text-sub uppercase tracking-widest block mb-1">Advance Paid</label>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${balanceDue > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                  Due: ₹{balanceDue.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-border-subtle w-1/2 md:w-1/3 shadow-inner">
                <span className="text-text-sub font-black">₹</span>
                <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-text-main font-black focus:ring-0 text-xl text-right" placeholder="0" />
              </div>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3 mt-4 mb-24">
          <button onClick={() => handleSubmit("Save")} disabled={loading} className="w-full md:w-1/3 h-14 rounded-2xl border-2 border-border-subtle bg-surface text-text-main font-bold hover:bg-bg-main transition-colors flex items-center justify-center gap-2">
            Save Only
          </button>
          <button onClick={() => handleSubmit("SaveAndSend")} disabled={loading} className="w-full md:w-2/3 h-14 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/30 hover:bg-blue-600 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 text-lg">
            {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">send</span>}
            {loading ? "Processing..." : `Create & Send to Client`}
          </button>
        </div>

      </main>
    </div>
  );
}