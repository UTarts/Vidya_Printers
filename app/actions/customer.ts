"use server";

import { supabaseAdmin } from "../../lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const businessName = formData.get("businessName") as string;
  const address = formData.get("address") as string;

  const email = `${phone}@vidyaprinters.com`;
  const defaultPassword = phone; 

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: defaultPassword,
      email_confirm: true, 
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Failed to create user auth");

    const userId = authData.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      full_name: fullName,
      phone_number: phone,
      role: "client",
      permissions: {},
    });

    if (profileError) throw new Error(profileError.message);

    const { error: clientError } = await supabaseAdmin.from("clients_data").insert({
      profile_id: userId,
      business_name: businessName || null,
      address: address || null,
      total_dues: 0,
    });

    if (clientError) throw new Error(clientError.message);

    revalidatePath("/customers");

    return { success: true, message: "Customer created successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getCustomers() {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        full_name,
        phone_number,
        created_at,
        clients_data (
          business_name,
          address,
          total_dues
        )
      `)
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, message: error.message, data: [] };
  }
}