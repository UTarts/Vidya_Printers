"use server";

import { supabaseAdmin } from "../../lib/supabase-admin";
import { revalidatePath } from "next/cache";

// 1. Fetch Next Order ID
export async function getNextOrderId() {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("display_id")
      .not("display_id", "is", null)
      .order("display_id", { ascending: false })
      .limit(1)
      .single();

    if (!data || !data.display_id) return "VP-1001"; // Starting point

    const currentNum = parseInt(data.display_id.replace("VP-", ""));
    return `VP-${currentNum + 1}`;
  } catch (e) {
    return "VP-1001";
  }
}

// 2. Create the Order
export async function createAdvancedOrder(payload: any) {
  try {
    let totalGst = 0;
    let rawSubtotal = 0;

    for (const item of payload.items) {
      const lineTotal = item.qty * item.price;
      rawSubtotal += lineTotal;
      totalGst += (lineTotal * item.gst) / 100;
    }

    const grandTotal = rawSubtotal + totalGst - (payload.discountAmount || 0);

    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        display_id: payload.displayId, 
        client_id: payload.customerId,
        order_type: payload.orderType,
        status: payload.orderType === 'Quotation' ? 'Draft' : 'Pending',
        total_amount: grandTotal,
        gst_amount: totalGst,
        discount_amount: payload.discountAmount || 0,
        amount_paid: payload.amountPaid || 0,
        design_file_link: payload.attachmentUrl || null, 
        job_notes: payload.jobNotes || null,
      })
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    const itemsToInsert = payload.items.map((item: any) => ({
      order_id: newOrder.id,
      service_id: item.serviceId || null,
      custom_service_name: item.customName,
      quantity: item.qty,
      unit_price: item.price,
      gst_rate: item.gst,
      total_line_amount: (item.qty * item.price) + ((item.qty * item.price * item.gst) / 100)
    }));

    await supabaseAdmin.from("order_items").insert(itemsToInsert);

    if (payload.orderType === 'Order') {
      const addedDues = grandTotal - (payload.amountPaid || 0);
      if (addedDues > 0) {
        const { data: clientData } = await supabaseAdmin.from("clients_data").select("total_dues").eq("profile_id", payload.customerId).single();
        await supabaseAdmin.from("clients_data").update({ total_dues: (clientData?.total_dues || 0) + addedDues }).eq("profile_id", payload.customerId);
      }
      for (const item of payload.items) {
        if (item.serviceId) {
          const { data: service } = await supabaseAdmin.from("services_catalog").select("required_inventory_item_id, units_consumed_per_order").eq("id", item.serviceId).single();
          if (service?.required_inventory_item_id && service.units_consumed_per_order > 0) {
            const { data: inv } = await supabaseAdmin.from("inventory").select("current_stock_quantity").eq("id", service.required_inventory_item_id).single();
            if (inv) await supabaseAdmin.from("inventory").update({ current_stock_quantity: inv.current_stock_quantity - (service.units_consumed_per_order * item.qty) }).eq("id", service.required_inventory_item_id);
          }
        }
      }
    }

    revalidatePath("/orders");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 3. (RESTORED) Fetch all orders for the table
export async function getOrders() {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        profiles ( full_name, phone_number ),
        order_items ( custom_service_name, quantity, total_line_amount )
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, message: error.message, data: [] };
  }
}