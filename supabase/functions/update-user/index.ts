import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

type UserRole = 'owner' | 'manager' | 'staff';

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeEmployeeId(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

function roleOrDefault(value: unknown): UserRole {
  return value === 'owner' || value === 'manager' || value === 'staff' ? value : 'staff';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(401, { error: 'Missing Authorization header' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse(500, { error: 'Server misconfiguration: missing environment variables' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !callerUser) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'owner') {
      return jsonResponse(403, { error: 'Forbidden: only owner can update users' });
    }

    let body: { user_id?: string; password?: string; full_name?: string; employee_id?: string; role?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const userId = (body.user_id ?? '').trim();
    if (!userId) {
      return jsonResponse(400, { error: 'Missing user_id' });
    }

    const employeeId = body.employee_id ? normalizeEmployeeId(body.employee_id) : null;
    const password = body.password ? (body.password ?? '').trim() : null;
    const fullName = body.full_name ? (body.full_name ?? '').trim() : null;
    const role = body.role ? roleOrDefault(body.role) : null;

    if (password && password.length < 6) {
      return jsonResponse(400, { error: 'Password must be at least 6 characters' });
    }

    const { data: existing, error: existingError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (existingError || !existing.user) {
      return jsonResponse(404, { error: existingError?.message ?? 'User not found' });
    }

    const currentEmail = existing.user.email ?? '';
    const employeeToUse = employeeId ?? (currentEmail.split('@')[0] ?? '');
    const email = `${employeeToUse}@npp.local`;

    const userMetadata: Record<string, unknown> = {
      ...(existing.user.user_metadata ?? {}),
    };
    if (fullName) userMetadata.full_name = fullName;
    if (role) userMetadata.role = role;
    if (employeeId) userMetadata.employee_id = employeeId;

    const adminUpdate: Parameters<typeof supabaseAdmin.auth.admin.updateUserById>[1] = {
      ...(password ? { password } : {}),
      ...(employeeId ? { email } : {}),
      user_metadata: userMetadata,
    };

    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, adminUpdate);
    if (updateError || !updateData.user) {
      console.error('Update user error:', updateError);
      return jsonResponse(400, { error: updateError?.message ?? 'Failed to update user' });
    }

    const profileUpdate: Record<string, unknown> = {
      id: userId,
    };
    if (fullName) profileUpdate.full_name = fullName;
    if (role) profileUpdate.role = role;
    if (employeeId) profileUpdate.employee_id = employeeId;

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(profileUpdate);
    if (profileError) {
      console.error('Profile update error:', profileError);
      return jsonResponse(500, { error: profileError.message });
    }

    return jsonResponse(200, {
      success: true,
      user: {
        id: userId,
        email,
        full_name: (fullName ?? existing.user.user_metadata?.full_name) as string,
        role: (role ?? existing.user.user_metadata?.role) as string,
        employee_id: (employeeId ?? employeeToUse),
      },
    });
  } catch (err) {
    console.error('Unhandled error in update-user:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse(500, { error: msg });
  }
});