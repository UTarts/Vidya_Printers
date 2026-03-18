"use server";

import { supabaseAdmin } from "../../lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function getCustomerHub(customerId: string) {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*, clients_data(business_name, total_dues)")
      .eq("id", customerId)
      .single();

    // Fetch ALL orders to separate into Active and Past in the UI
    const { data: allOrders } = await supabaseAdmin
      .from("orders")
      .select("id, display_id, total_amount, amount_paid, status, created_at, order_items(custom_service_name)")
      .eq("client_id", customerId)
      .order("created_at", { ascending: false });

    const { data: timeline } = await supabaseAdmin
      .from("timeline_events")
      .select("*, orders(display_id)")
      .eq("client_id", customerId)
      .order("created_at", { ascending: true });

    return { 
      success: true, 
      profile, 
      orders: allOrders || [], 
      timeline: timeline || [] 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function addTimelineEvent(payload: any) {
  try {
    const { error } = await supabaseAdmin.from("timeline_events").insert({
      client_id: payload.customerId,
      order_id: payload.orderId || null,
      event_type: payload.eventType,
      description: payload.description,
      amount: payload.amount || 0,
      file_url: payload.fileUrl || null,
      author_name: payload.authorName || 'Admin', 
    });
    if (error) throw new Error(error.message);

    if (payload.eventType === 'Payment' && payload.amount > 0) {
      const { data: client } = await supabaseAdmin.from("clients_data").select("total_dues").eq("profile_id", payload.customerId).single();
      if (client) {
        await supabaseAdmin.from("clients_data").update({ total_dues: client.total_dues - payload.amount }).eq("profile_id", payload.customerId);
      }
      if (payload.orderId) {
        const { data: order } = await supabaseAdmin.from("orders").select("amount_paid").eq("id", payload.orderId).single();
        if (order) {
          await supabaseAdmin.from("orders").update({ amount_paid: order.amount_paid + payload.amount }).eq("id", payload.orderId);
        }
      }
    }

    revalidatePath(`/customers/${payload.customerId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}