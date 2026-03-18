"use server";

import { supabaseAdmin } from "../../lib/supabase-admin";
import { revalidatePath } from "next/cache";

// 1. Fetch all staff (Filtered to exclude customers)
export async function getEmployees() {
    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .in("role", ["employee", "admin", "superadmin"]) 
        .order("created_at", { ascending: true });
  
      if (error) throw new Error(error.message);
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

// 2. Add New Employee (RESTORED)
export async function addEmployee(formData: FormData, permissions: any) {
  const fullName = formData.get("fullName") as string;
  const designation = formData.get("designation") as string;
  const empId = formData.get("empId") as string;
  const mobile = formData.get("mobile") as string;
  const password = formData.get("password") as string;

  try {
    const formattedEmail = `${mobile}@vidyaprinters.com`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: formattedEmail,
      password: password,
      email_confirm: true,
    });

    if (authError) throw new Error(authError.message);

    if (authData.user) {
      await supabaseAdmin.from("profiles").update({
        full_name: fullName,
        phone_number: mobile,
        role: "employee",
        designation: designation,
        emp_id: empId,
        status: "Active",
        permissions: permissions
      }).eq("id", authData.user.id);
    }

    revalidatePath("/employees");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 3. Fetch a single employee and their entire activity history
export async function getEmployeeHub(employeeId: string) {
  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", employeeId)
      .single();
      
    if (profileError) throw new Error(profileError.message);

    const { data: activityLog, error: activityError } = await supabaseAdmin
      .from("timeline_events")
      .select("*, orders(display_id), clients_data!timeline_events_client_id_fkey(business_name)")
      .eq("author_name", profile.full_name)
      .order("created_at", { ascending: false });

    return { success: true, profile, activityLog: activityLog || [] };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 4. Update Basic Profile & Status (Lockouts)
export async function updateEmployeeProfile(employeeId: string, payload: any) {
  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: payload.fullName,
        designation: payload.designation,
        emp_id: payload.empId,
        status: payload.status 
      })
      .eq("id", employeeId);
      
    if (error) throw new Error(error.message);
    revalidatePath(`/employees/${employeeId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 5. Update the Granular JSON Permissions
export async function updateEmployeePermissions(employeeId: string, permissions: any) {
  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ permissions })
      .eq("id", employeeId);
      
    if (error) throw new Error(error.message);
    revalidatePath(`/employees/${employeeId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 6. Force a Password Reset
export async function resetEmployeePassword(employeeId: string, newPassword: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(employeeId, {
      password: newPassword
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}