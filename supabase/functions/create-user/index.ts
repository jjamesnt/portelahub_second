import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Verify caller is Master
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error('Não autorizado');

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'master') {
            throw new Error('Apenas Master Admins podem criar usuários ativamente');
        }

        // Get Request Body
        const { email, password, full_name, phone, role, status } = await req.json();

        if (!email || !password || !full_name || !role) {
            throw new Error('Dados incompletos');
        }

        // Init Admin Client (Service Role) to bypass RLS and create Auth User
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Create User in Auth
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, phone }
        });

        if (createError) throw createError;

        // 2. Insert into Profiles table
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
            id: newUser.user.id,
            email,
            full_name,
            phone,
            role: role || 'user',
            status: status || 'active'
        });

        if (profileError) {
            // Rollback auth user creation if profile fails
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            throw profileError;
        }

        return new Response(JSON.stringify({ user: newUser.user, message: 'Usuário criado com sucesso' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
