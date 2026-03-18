"use client";

import { useState, useEffect } from "react";
import { addService, getServicesCatalog } from "../actions/services";

export default function ServicesCatalogPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoadingData(true);
    const result = await getServicesCatalog();
    if (result.success) {
      setServices(result.services);
      setInventoryList(result.inventory);
    }
    setLoadingData(false);
  }

  async function handleAddService(formData: FormData) {
    setLoading(true);
    const result = await addService(formData);
    if (result.success) {
      setShowAddModal(false);
      fetchData();
    }
    setLoading(false);
  }

  const filteredServices = services.filter(s => {
    const matchesSearch = s.service_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // We don't have a strict category column in DB yet, so we map visually based on name or just use "All" for now.
    // In a real DB upgrade, you'd filter by s.category === activeFilter
    
    return matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-bg-main text-text-main font-display overflow-hidden pb-20">
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 pb-2 bg-surface sticky top-0 z-10 border-b border-border-subtle md:pt-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-text-main">Services & Pricing</h1>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-primary/20 transition-transform active:scale-95 flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">add</span> Add New
        </button>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-surface z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-text-sub">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full p-3.5 pl-12 text-sm font-bold rounded-xl bg-bg-main border border-border-subtle text-text-main placeholder-text-sub focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
            placeholder="Search services (e.g., Offset, Flex)..." 
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide bg-surface border-b border-border-subtle z-10 shadow-sm">
        {["All", "Offset", "Digital", "Large Format", "Binding"].map(filter => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`shrink-0 h-10 px-5 rounded-full text-sm font-black transition-all border ${
              activeFilter === filter 
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                : 'bg-bg-main text-text-sub border-border-subtle hover:bg-border-subtle'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Content List */}
      <main className="flex-1 overflow-y-auto bg-bg-main p-4 space-y-4">
        {loadingData ? (
          <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-2xl border border-border-subtle mt-4">
            <span className="material-symbols-outlined text-text-sub text-4xl mb-2">category</span>
            <h3 className="text-text-main font-bold">No Services Found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service, idx) => {
              // Cycle Icons for Visual Flair
              const icons = ["print", "imagesmode", "style", "layers"];
              const colors = ["text-blue-500 bg-blue-500/10", "text-purple-500 bg-purple-500/10", "text-orange-500 bg-orange-500/10", "text-emerald-500 bg-emerald-500/10"];
              const icon = icons[idx % icons.length];
              const color = colors[idx % colors.length];
              const isLinked = !!service.inventory;

              return (
                <div key={service.id} className="bg-surface rounded-2xl p-5 shadow-sm border border-border-subtle hover:border-primary/40 transition-colors group relative flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-border-subtle ${color}`}>
                        <span className="material-symbols-outlined text-[24px]">{icon}</span>
                      </div>
                      <div>
                        <h3 className="font-black text-text-main text-base leading-tight mb-1">{service.service_name}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-sub">Printing Catalog</p>
                      </div>
                    </div>
                    <button className="text-text-sub hover:text-primary bg-bg-main p-1.5 rounded-lg border border-border-subtle transition-colors">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-5 bg-bg-main p-3 rounded-xl border border-border-subtle">
                    <div>
                      <p className="text-[9px] uppercase font-black tracking-widest text-text-sub mb-1">Base Price</p>
                      <p className="text-lg font-black text-text-main leading-none">₹{service.base_price}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-black tracking-widest text-text-sub mb-1.5">GST Slab</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-bg-main border border-border-subtle text-text-main shadow-sm">
                        {service.gst_rate}% GST
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-text-sub">inventory_2</span>
                      {isLinked ? (
                        <span className="text-xs font-bold text-success">Linked: {service.inventory.item_name}</span>
                      ) : (
                        <span className="text-xs font-bold text-warning">Unlinked Manual Entry</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-bg-main/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg border border-border-subtle overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-bg-main/50 shrink-0">
              <h2 className="text-lg font-black text-text-main flex items-center gap-2"><span className="material-symbols-outlined text-primary">sell</span> Add Service</h2>
              <button onClick={() => setShowAddModal(false)} className="text-text-sub hover:text-danger bg-surface p-1.5 rounded-full shadow-sm border border-border-subtle"><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form action={handleAddService} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Service Name</label>
                  <input type="text" name="serviceName" required className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-text-main text-sm" placeholder="e.g. 1000 Business Cards (300gsm)" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Base Price (₹)</label>
                    <input type="number" name="basePrice" required className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-text-main text-sm" placeholder="e.g. 500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">GST Slab</label>
                    <select name="gstRate" className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-text-main text-sm appearance-none">
                      <option value="18">18%</option>
                      <option value="12">12%</option>
                      <option value="5">5%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 mt-4">
                  <h4 className="text-xs font-black text-primary mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">link</span> Smart Inventory Link
                  </h4>
                  <p className="text-[10px] font-bold text-text-sub mb-4">Link this service to automatically deduct raw materials when ordered.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">Select Raw Material</label>
                      <div className="relative">
                        <select name="inventoryId" className="w-full p-3 bg-surface border border-primary/30 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold text-text-main appearance-none">
                          <option value="none">-- Do not link material --</option>
                          {inventoryList.map((item) => (
                            <option key={item.id} value={item.id}>{item.item_name} ({item.unit_type})</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-3 text-primary pointer-events-none text-[18px]">expand_more</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">Units Consumed Per Order</label>
                      <input type="number" name="unitsConsumed" step="0.01" defaultValue="0" className="w-full p-3 bg-surface border border-primary/30 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold text-text-main" placeholder="e.g. 10" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white font-black py-4 px-4 rounded-xl shadow-lg shadow-primary/30 mt-4 transition-all active:scale-95 text-lg flex items-center justify-center gap-2">
                  {loading && <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>}
                  {loading ? "Saving..." : "Save Catalog Entry"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}