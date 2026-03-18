"use server";

import { supabaseAdmin } from "../../lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { addTimelineEvent } from "./timeline";

export async function getOrderHub(orderId: string) {
  try {
    // 1. Fetch the master order and the customer details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        profiles ( id, full_name, phone_number ),
        order_items ( id, custom_service_name, quantity, total_line_amount )
      `)
      .eq("id", orderId)
      .single();

    if (orderError) throw new Error("Order not found.");

    // 2. Fetch the chat timeline for just this order
    const { data: timeline } = await supabaseAdmin
      .from("timeline_events")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    // 3. Fetch materials manually consumed for this order
    const { data: materialsUsed } = await supabaseAdmin
      .from("order_materials_used")
      .select("*, inventory(item_name, unit_type)")
      .eq("order_id", orderId)
      .order("logged_at", { ascending: false });

    // 4. Fetch full inventory list for the dropdown
    const { data: inventoryList } = await supabaseAdmin
      .from("inventory")
      .select("id, item_name, unit_type, current_stock_quantity")
      .order("item_name", { ascending: true });

    return { 
      success: true, 
      order, 
      timeline: timeline || [], 
      materialsUsed: materialsUsed || [],
      inventoryList: inventoryList || []
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateOrderStatus(orderId: string, customerId: string, newStatus: string) {
  try {
    await supabaseAdmin.from("orders").update({ status: newStatus }).eq("id", orderId);
    
    // Automatically log this change in the WhatsApp timeline
    await addTimelineEvent({
      customerId,
      orderId,
      eventType: "Status_Change",
      description: `Order status updated to: ${newStatus}`,
    });

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function logManualMaterial(orderId: string, inventoryId: string, qtyUsed: number) {
  try {
    // 1. Log the usage
    await supabaseAdmin.from("order_materials_used").insert({
      order_id: orderId,
      inventory_id: inventoryId,
      quantity_used: qtyUsed
    });

    // 2. Deduct from master inventory
    const { data: inv } = await supabaseAdmin.from("inventory").select("current_stock_quantity").eq("id", inventoryId).single();
    if (inv) {
      await supabaseAdmin.from("inventory").update({ current_stock_quantity: inv.current_stock_quantity - qtyUsed }).eq("id", inventoryId);
    }

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}