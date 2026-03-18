"use server";

import { supabaseAdmin } from "../../lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function addService(formData: FormData) {
  const serviceName = formData.get("serviceName") as string;
  const basePrice = Number(formData.get("basePrice"));
  const gstRate = Number(formData.get("gstRate"));
  const inventoryId = formData.get("inventoryId") as string;
  const unitsConsumed = Number(formData.get("unitsConsumed") || 0);

  try {
    const { error } = await supabaseAdmin.from("services_catalog").insert({
      service_name: serviceName,
      base_price: basePrice,
      gst_rate: gstRate,
      // If they didn't select an inventory item, save as null
      required_inventory_item_id: inventoryId === "none" ? null : inventoryId,
      units_consumed_per_order: unitsConsumed,
    });

    if (error) throw new Error(error.message);
    revalidatePath("/services");
    return { success: true, message: "Service added successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getServicesCatalog() {
  try {
    // We fetch services and join the inventory table to see what material it uses
    const { data: services, error } = await supabaseAdmin
      .from("services_catalog")
      .select(`
        *,
        inventory (
          item_name,
          unit_type
        )
      `)
      .order("service_name", { ascending: true });

    if (error) throw new Error(error.message);

    // We also need a list of inventory items to populate the dropdown in the Add form
    const { data: inventory } = await supabaseAdmin
      .from("inventory")
      .select("id, item_name, unit_type")
      .order("item_name", { ascending: true });

    return { success: true, services: services || [], inventory: inventory || [] };
  } catch (error: any) {
    return { success: false, message: error.message, services: [], inventory: [] };
  }
}