"use client";

import { useState, useEffect } from "react";
import { addInventoryItem, addSupplier, getInventoryDashboard } from "../actions/inventory";

export default function InventoryWarehouse() {
  const [activeTab, setActiveTab] = useState("materials");
  const [showItemModal, setShowItemModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoadingData(true);
    const result = await getInventoryDashboard();
    if (result.success) {
      setInventory(result.inventory);
      setSuppliers(result.suppliers);
    }
    setLoadingData(false);
  }

  async function handleAddItem(formData: FormData) {
    setLoading(true);
    await addInventoryItem(formData);
    setShowItemModal(false);
    fetchData();
    setLoading(false);
  }

  async function handleAddSupplier(formData: FormData) {
    setLoading(true);
    await addSupplier(formData);
    setShowSupplierModal(false);
    fetchData();
    setLoading(false);
  }

  const filteredInventory = inventory.filter(i => i.item_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSuppliers = suppliers.filter(s => s.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const criticalItems = inventory.filter(i => i.current_stock_quantity <= i.low_stock_warning_level);

  return (
    <div className="flex flex-col min-h-screen bg-bg-main text-text-main font-display overflow-x-hidden pb-24">
      
      {/* Header Section */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border-subtle pt-2 md:pt-6 shadow-sm">
        <div className="flex items-center p-4 pb-2 justify-between">
          <h2 className="text-xl font-black leading-tight tracking-tight flex-1">Inventory Warehouse</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => activeTab === 'materials' ? setShowItemModal(true) : setShowSupplierModal(true)} className="flex items-center justify-center rounded-xl px-4 h-10 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-bold text-sm gap-1 border border-primary/20">
              <span className="material-symbols-outlined text-[20px]">add_box</span> Add New
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <div className="flex border-b border-border-subtle justify-between">
            <button onClick={() => setActiveTab("materials")} className="relative flex flex-col items-center justify-center pb-3 pt-4 flex-1 group outline-none">
              <p className={`text-sm font-black transition-colors ${activeTab === 'materials' ? 'text-primary' : 'text-text-sub group-hover:text-text-main'}`}>Raw Materials</p>
              {activeTab === 'materials' && <div className="absolute bottom-0 h-1 w-full bg-primary rounded-t-full"></div>}
            </button>
            <button onClick={() => setActiveTab("suppliers")} className="relative flex flex-col items-center justify-center pb-3 pt-4 flex-1 group outline-none">
              <p className={`text-sm font-black transition-colors ${activeTab === 'suppliers' ? 'text-primary' : 'text-text-sub group-hover:text-text-main'}`}>Suppliers</p>
              {activeTab === 'suppliers' && <div className="absolute bottom-0 h-1 w-full bg-primary rounded-t-full"></div>}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 bg-bg-main">
          <div className="flex w-full items-center rounded-xl h-12 overflow-hidden border border-border-subtle focus-within:border-primary focus-within:ring-2 ring-primary/20 transition-all bg-surface">
            <div className="text-text-sub flex items-center justify-center pl-4 pr-2">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex w-full min-w-0 flex-1 bg-transparent text-text-main focus:outline-none h-full placeholder:text-text-sub px-2 text-sm font-bold" 
              placeholder={activeTab === 'materials' ? "Search paper, ink, rolls..." : "Search vendors..."}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6 p-4">
        
        {loadingData ? (
           <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>
        ) : activeTab === "materials" ? (
          <>
            {/* Critical Alerts Section */}
            {criticalItems.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="tracking-tight text-lg font-black text-text-main">Critical Stock Alerts</h3>
                  <span className="px-2 py-0.5 rounded-md bg-danger/10 text-danger text-[10px] font-black uppercase tracking-wider border border-danger/20">{criticalItems.length} Low</span>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
                  {criticalItems.map(item => {
                    const percentage = Math.max(5, (item.current_stock_quantity / item.low_stock_warning_level) * 100);
                    return (
                      <div key={item.id} className="snap-center flex-shrink-0 w-64 p-4 rounded-2xl bg-surface border border-danger/30 shadow-[0_4px_20px_-5px_rgba(239,68,68,0.15)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                          <span className="material-symbols-outlined text-danger text-7xl">warning</span>
                        </div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-2">
                            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger border border-danger/20">
                              <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <span className="text-[9px] font-black text-white bg-danger px-2 py-1 rounded shadow-sm tracking-widest uppercase animate-pulse">Critical</span>
                          </div>
                          <h4 className="text-text-main font-black text-base mb-0.5 truncate">{item.item_name}</h4>
                          <p className="text-text-sub text-xs mb-3 font-medium">Measured in {item.unit_type}</p>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-text-sub uppercase font-black tracking-widest mb-0.5">Remaining</p>
                              <p className="text-2xl font-black text-danger leading-none">{item.current_stock_quantity}</p>
                            </div>
                            <button className="bg-danger hover:bg-red-600 text-white text-xs font-black py-2 px-3 rounded-lg transition-colors shadow-sm">Restock</button>
                          </div>
                          <div className="w-full bg-bg-main h-1.5 rounded-full mt-4 overflow-hidden border border-border-subtle">
                            <div className="bg-danger h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categories Grid */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="tracking-tight text-lg font-black text-text-main">Inventory Status</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredInventory.map((item, idx) => {
                  const isHealthy = item.current_stock_quantity > item.low_stock_warning_level;
                  // Alternate some background colors based on index for the image placeholder
                  const bgColors = ["from-blue-500 to-cyan-500", "from-purple-500 to-pink-500", "from-amber-500 to-orange-500", "from-emerald-500 to-teal-500"];
                  const bgGradient = bgColors[idx % bgColors.length];

                  return (
                    <div key={item.id} className="bg-surface p-3 rounded-2xl border border-border-subtle hover:border-primary/50 transition-colors shadow-sm group flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2">
                          <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                             <span className="material-symbols-outlined text-white/50 text-4xl">inventory_2</span>
                          </div>
                          <div className={`absolute top-2 right-2 backdrop-blur-md text-[9px] font-black px-2 py-1 rounded border uppercase tracking-wider shadow-sm ${isHealthy ? 'bg-success/20 text-white border-white/40' : 'bg-danger/80 text-white border-white/40 animate-pulse'}`}>
                            {isHealthy ? 'Healthy' : 'Low Stock'}
                          </div>
                        </div>
                      </div>
                      <h4 className="text-text-main font-black text-sm leading-tight mb-1 truncate" title={item.item_name}>{item.item_name}</h4>
                      <p className="text-text-sub text-xs mb-2 font-medium">Alert at: {item.low_stock_warning_level}</p>
                      <div className="flex items-end justify-between mt-auto pt-2">
                        <span className={`font-black text-xl ${isHealthy ? 'text-text-main' : 'text-danger'}`}>{item.current_stock_quantity} <span className="text-[10px] font-bold text-text-sub uppercase tracking-wider">{item.unit_type}</span></span>
                        <div className="w-8 h-8 rounded-full bg-bg-main flex items-center justify-center text-text-sub group-hover:bg-primary group-hover:text-white transition-colors border border-border-subtle">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Suppliers Tab */
          <div className="bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-main border-b border-border-subtle text-[10px] uppercase tracking-widest text-text-sub font-black">
                    <th className="p-4">Vendor Details</th>
                    <th className="p-4 hidden md:table-cell">Materials Supplied</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredSuppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-bg-main/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 shrink-0">
                            {sup.vendor_name.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-text-main text-sm">{sup.vendor_name}</p>
                            <p className="text-xs text-text-sub font-medium flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-[12px]">call</span> {sup.contact_number}</p>
                            <p className="text-xs text-text-sub font-medium mt-1 md:hidden truncate max-w-[200px]"><span className="font-bold text-text-main">Supplies:</span> {sup.materials_supplied}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm text-text-main font-medium">{sup.materials_supplied}</td>
                      <td className="p-4 text-right">
                        <button className="text-primary bg-primary/10 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS (Glassmorphic Redesign) --- */}
      {showItemModal && (
        <div className="fixed inset-0 bg-bg-main/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md border border-border-subtle overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-bg-main/50">
              <h2 className="text-lg font-black text-text-main flex items-center gap-2"><span className="material-symbols-outlined text-primary">add_box</span> Add Raw Material</h2>
              <button onClick={() => setShowItemModal(false)} className="text-text-sub hover:text-danger bg-surface p-1.5 rounded-full shadow-sm border border-border-subtle"><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
            <form action={handleAddItem} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Material Name</label>
                <input type="text" name="itemName" required className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-text-main text-sm" placeholder="e.g. Glossy Paper 300gsm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Unit Type</label>
                  <select name="unitType" className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-text-main text-sm appearance-none">
                    <option value="Sheets">Sheets</option>
                    <option value="SqFt">Sq. Ft.</option>
                    <option value="Liters">Liters</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Rolls">Rolls</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Initial Stock</label>
                  <input type="number" name="initialStock" required defaultValue="0" className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-text-main text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-danger uppercase tracking-widest mb-1.5">Low Stock Alert Level</label>
                <input type="number" name="warningLevel" required defaultValue="50" className="w-full p-3.5 bg-danger/5 border border-danger/30 rounded-xl focus:ring-2 focus:ring-danger outline-none font-bold text-text-main text-sm" placeholder="Alert when stock hits this number" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-blue-600 text-white font-black py-4 px-4 rounded-xl shadow-lg shadow-primary/30 mt-2 transition-all active:scale-95 disabled:opacity-50">
                {loading ? "Saving..." : "Save Material to Warehouse"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showSupplierModal && (
        <div className="fixed inset-0 bg-bg-main/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md border border-border-subtle overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-bg-main/50">
              <h2 className="text-lg font-black text-text-main flex items-center gap-2"><span className="material-symbols-outlined text-primary">local_shipping</span> Add Vendor</h2>
              <button onClick={() => setShowSupplierModal(false)} className="text-text-sub hover:text-danger bg-surface p-1.5 rounded-full shadow-sm border border-border-subtle"><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
            <form action={handleAddSupplier} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Vendor / Company Name</label>
                <input type="text" name="vendorName" required className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-text-main text-sm" placeholder="e.g. Agarwal Paper Mill" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Contact Info (Phone/Email)</label>
                <input type="text" name="contactNumber" className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-text-main text-sm" placeholder="Contact Details" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-text-sub uppercase tracking-widest mb-1.5">Materials Supplied</label>
                <textarea name="materials" className="w-full p-3.5 bg-bg-main border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-text-main text-sm min-h-[100px] resize-none" placeholder="e.g. Glossy paper, Flex rolls..." />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-blue-600 text-white font-black py-4 px-4 rounded-xl shadow-lg shadow-primary/30 mt-2 transition-all active:scale-95 disabled:opacity-50">
                {loading ? "Saving..." : "Save Vendor"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}