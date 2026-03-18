"use server";

import { supabaseAdmin } from "../../lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function getFinancialDashboard() {
  try {
    // 1. Get Total Revenue & GST (from Orders)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("amount_paid, gst_amount")
      .neq("status", "Draft");
      
    let totalRevenue = 0;
    let totalGst = 0;
    
    if (orders) {
      orders.forEach(o => {
        totalRevenue += Number(o.amount_paid || 0);
        totalGst += Number(o.gst_amount || 0);
      });
    }

    // 2. Get Pending Market Dues (from Clients Data)
    const { data: clients } = await supabaseAdmin
      .from("clients_data")
      .select("total_dues");
      
    let totalDues = 0;
    if (clients) {
      clients.forEach(c => {
        totalDues += Number(c.total_dues || 0);
      });
    }

    // 3. Get Expenses
    const { data: expenses } = await supabaseAdmin
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    let totalExpenses = 0;
    if (expenses) {
      expenses.forEach(e => {
        totalExpenses += Number(e.amount || 0);
      });
    }

    return { 
      success: true, 
      metrics: {
        revenue: totalRevenue,
        dues: totalDues,
        expenses: totalExpenses,
        gst: totalGst,
        profit: totalRevenue - totalExpenses
      },
      expenseList: expenses || []
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function logExpense(formData: FormData, authorName: string) {
  try {
    const category = formData.get("category") as string;
    const amount = Number(formData.get("amount"));
    const description = formData.get("description") as string;

    const { error } = await supabaseAdmin.from("expenses").insert({
      category,
      amount,
      description,
      logged_by: authorName
    });

    if (error) throw new Error(error.message);
    
    revalidatePath("/financials");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}