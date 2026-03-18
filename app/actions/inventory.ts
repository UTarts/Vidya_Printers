"use server";

import { supabaseAdmin } from "../../lib/supabase-admin";
import { revalidatePath } from "next/cache";

// --- INVENTORY ACTIONS ---
export async function addInventoryItem(formData: FormData) {
  const itemName = formData.get("itemName") as string;
  const unitType = formData.get("unitType") as string;
  const warningLevel = Number(formData.get("warningLevel"));
  const initialStock = Number(formData.get("initialStock") || 0);

  try {
    const { error } = await supabaseAdmin.from("inventory").insert({
      item_name: itemName,
      unit_type: unitType,
      low_stock_warning_level: warningLevel,
      current_stock_quantity: initialStock,
    });

    if (error) throw new Error(error.message);
    revalidatePath("/inventory");
    return { success: true, message: "Material added successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- SUPPLIER ACTIONS ---
export async function addSupplier(formData: FormData) {
  const vendorName = formData.get("vendorName") as string;
  const contactNumber = formData.get("contactNumber") as string;
  const materials = formData.get("materials") as string;

  try {
    const { error } = await supabaseAdmin.from("suppliers").insert({
      vendor_name: vendorName,
      contact_number: contactNumber,
      materials_supplied: materials,
    });

    if (error) throw new Error(error.message);
    revalidatePath("/inventory");
    return { success: true, message: "Supplier added successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- FETCH ALL DATA ---
export async function getInventoryDashboard() {
  try {
    const { data: inventory, error: invError } = await supabaseAdmin
      .from("inventory")
      .select("*")
      .order("item_name", { ascending: true });

    const { data: suppliers, error: supError } = await supabaseAdmin
      .from("suppliers")
      .select("*")
      .order("vendor_name", { ascending: true });

    if (invError) throw new Error(invError.message);
    if (supError) throw new Error(supError.message);

    return { success: true, inventory: inventory || [], suppliers: suppliers || [] };
  } catch (error: any) {
    return { success: false, message: error.message, inventory: [], suppliers: [] };
  }
}