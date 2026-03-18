"use server";

import { supabaseAdmin } from "../../lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const businessName = formData.get("businessName") as string;
  const address = formData.get("address") as string;

  // 1. Format the dummy email and set a default password
  const email = `${phone}@vidyaprinters.com`;
  const defaultPassword = phone; // Using their phone number as the first password

  try {
    // 2. Create the user in Supabase Auth using the Master Key
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: defaultPassword,
      email_confirm: true, // Auto-verify so they can log in immediately
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Failed to create user auth");

    const userId = authData.user.id;

    // 3. Save to the Profiles table
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      full_name: fullName,
      phone_number: phone,
      role: "client",
      permissions: {},
    });

    if (profileError) throw new Error(profileError.message);

    // 4. Save the extra details to the Clients Data table
    const { error: clientError } = await supabaseAdmin.from("clients_data").insert({
      profile_id: userId,
      business_name: businessName || null,
      address: address || null,
      total_dues: 0,
    });

    if (clientError) throw new Error(clientError.message);

    // 5. Tell Next.js to refresh the page data so the new customer appears instantly
    revalidatePath("/customers");

    return { success: true, message: "Customer created successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
// ... existing createCustomer function above ...

export async function getCustomers() {
    try {
      // We fetch profiles where role is 'client', and join the matching clients_data
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