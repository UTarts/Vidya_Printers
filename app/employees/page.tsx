"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getEmployees } from "../actions/employees";

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    async function fetchAll() {
      const res = await getEmployees();
      if (res.success) setEmployees(res.data);
      setLoading(false);
    }
    fetchAll();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.emp_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.designation?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === "All") return matchesSearch;
    return matchesSearch && emp.status === activeFilter;
  });

  return (
    <div className="bg-bg-main text-text-main min-h-screen flex flex-col font-display overflow-x-hidden pb-24">
      
      {/* Header Section */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border-subtle px-4 pt-4 pb-2 shadow-sm md:pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-text-main">Employee Directory</h1>
          </div>
          <button className="relative p-2 rounded-full hover:bg-bg-main transition-colors text-text-main hidden md:block">
            <span className="material-symbols-outlined text-2xl">notifications</span>
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-danger border-2 border-surface"></span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-text-sub">search</span>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-main border border-border-subtle rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary placeholder:text-text-sub shadow-inner outline-none" 
            placeholder="Search by name, ID or role..." 
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {["All", "Active", "On Leave", "Inactive"].map(filter => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-none px-5 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${
                activeFilter === filter 
                  ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30' 
                  : 'bg-surface border-border-subtle text-text-sub hover:text-text-main'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content List */}
      <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        
        <Link href="/employees/new" className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white rounded-xl py-3.5 font-black shadow-lg shadow-primary/20 transition-transform active:scale-95">
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Add New Employee</span>
        </Link>

        <div className="flex items-center justify-between mt-6 mb-2">
          <h2 className="text-xs font-black text-text-sub uppercase tracking-widest">Our Staff</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span></div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-2xl border border-border-subtle">
            <span className="material-symbols-outlined text-text-sub text-4xl mb-2">badge</span>
            <h3 className="text-text-main font-bold">No Staff Found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((emp, idx) => {
              const initials = emp.full_name?.substring(0, 2).toUpperCase() || "VP";
              const gradients = ["from-blue-400 to-indigo-500", "from-emerald-400 to-teal-600", "from-orange-400 to-red-500"];
              const gradient = gradients[idx % gradients.length];
              
              let statusColor = "bg-success border-surface";
              if (emp.status === "On Leave") statusColor = "bg-warning border-surface";
              if (emp.status === "Inactive") statusColor = "bg-slate-400 border-surface";

              return (
                // FIX: This whole card is now a clickable Link routing to the employee's hub
                <Link href={`/employees/${emp.id}`} key={emp.id} className={`block bg-surface rounded-2xl p-5 shadow-sm border border-border-subtle transition-all ${emp.status === 'Inactive' ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : 'hover:border-primary/40'}`}>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-lg shadow-inner border-2 border-surface`}>
                        {initials}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-4 h-4 ${statusColor} border-2 rounded-full`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-text-main truncate text-lg leading-tight">{emp.full_name}</h3>
                          <p className="text-sm font-medium text-text-sub truncate mt-0.5">{emp.designation || "Staff"} • {emp.emp_id || "ID Pending"}</p>
                        </div>
                        <div className="text-text-sub hover:bg-bg-main p-1.5 rounded-full transition-colors">
                          <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </div>
                      </div>
                      
                      {emp.status === 'On Leave' && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-warning/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-warning border border-warning/20">On Leave</span>
                        </div>
                      )}
                      {emp.status === 'Inactive' && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-text-sub/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-text-sub border border-border-subtle">Inactive</span>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <div className="flex-1 py-2 px-3 bg-bg-main text-xs font-bold text-text-main rounded-xl flex items-center justify-center gap-1.5 border border-border-subtle">
                          <span className="material-symbols-outlined text-[16px]">lock_reset</span> Pass
                        </div>
                        <div className="flex-1 py-2 px-3 bg-bg-main text-xs font-bold text-text-main rounded-xl flex items-center justify-center gap-1.5 border border-border-subtle">
                          <span className="material-symbols-outlined text-[16px]">manage_accounts</span> Perms
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}