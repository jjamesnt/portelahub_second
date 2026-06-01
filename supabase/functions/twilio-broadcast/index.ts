import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { eventId, recipients, channel, message } = await req.json()

        if (!eventId || !recipients || !channel || !message) {
            throw new Error('Missing required fields')
        }

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        const results = []

        for (const recipient of recipients) {
            // Limpeza e formatação E.164
            let rawPhone = recipient.phone.replace(/\D/g, '');
            if (rawPhone.length === 10 || rawPhone.length === 11) {
                if (!rawPhone.startsWith('55')) {
                    rawPhone = '55' + rawPhone;
                }
            }
            if (!rawPhone.startsWith('+')) {
                rawPhone = '+' + rawPhone;
            }

            const to = channel === 'whatsapp' ? `whatsapp:${rawPhone}` : rawPhone
            const from = channel === 'whatsapp' ? `whatsapp:${TWILIO_PHONE_NUMBER}` : TWILIO_PHONE_NUMBER

            const response = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        To: to,
                        From: from!,
                        Body: message,
                    }),
                }
            )

            const data = await response.json()

            // Log no banco de dados
            await supabase.from('notification_logs').insert({
                event_id: eventId,
                recipient_id: recipient.id,
                recipient_type: recipient.type,
                recipient_name: recipient.name || null,
                recipient_phone: recipient.phone || null,
                channel: channel,
                status: response.ok ? 'sent' : 'error',
                error_message: response.ok ? null : data.message,
                message_sid: data.sid,
                content: message
            })

            results.push({
                recipient: recipient.phone,
                success: response.ok,
                sid: data.sid
            })
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
