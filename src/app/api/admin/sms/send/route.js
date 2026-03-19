import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) { return cookieStore.get(name)?.value },
            },
        }
    )

    // 1. Verify Admin Session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 2. Parse Request
    const { recipients, message, sendToAll, name } = await request.json()
    if (!message || (!recipients && !sendToAll)) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const apiKey = process.env.ARKESEL_API_KEY
    const senderId = process.env.ARKESEL_SENDER_ID || 'HiveZone'

    if (!apiKey) return NextResponse.json({ error: 'API Key not configured' }, { status: 500 })

    // Helper to send a single SMS
    const sendSingleSMS = async (to, msg) => {
        const url = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${apiKey}&to=${to}&from=${senderId}&sms=${encodeURIComponent(msg)}&response=json`
        const resp = await fetch(url)
        try {
            return await resp.json()
        } catch (e) {
            return { code: 'error', msg: 'Invalid response' }
        }
    }

    // 3. Process Recipients and Send
    let results = [];
    let totalCount = 0;
    const hasPersonalization = message.includes('{{name}}');

    try {
        if (sendToAll) {
            // Fetch users with names for personalization if needed
            const { data: users, error: fetchError } = await supabase
                .from('users')
                .select('contact, first_name')
                .not('contact', 'is', null)
            
            if (fetchError) throw fetchError;
            
            // Clean and de-duplicate by phone number
            const uniqueUsers = Array.from(new Map(users.map(u => [u.contact?.trim(), u])).values())
                .filter(u => u.contact);

            if (uniqueUsers.length === 0) {
                return NextResponse.json({ error: 'No users found' }, { status: 400 })
            }

            if (hasPersonalization) {
                // Send individually for personalization with simple batching
                const batchSize = 10; // Send 10 at a time to avoid timeout
                for (let i = 0; i < uniqueUsers.length; i += batchSize) {
                    const batch = uniqueUsers.slice(i, i + batchSize);
                    await Promise.all(batch.map(async (u) => {
                        const personalizedMsg = message.replace(/{{name}}/g, u.first_name || 'User');
                        const res = await sendSingleSMS(u.contact, personalizedMsg);
                        results.push({ phone: u.contact, res, message: personalizedMsg });
                    }));
                }
            } else {
                // Send bulk (comma separated)
                const phoneNumbers = uniqueUsers.map(u => u.contact).join(',');
                const res = await sendSingleSMS(phoneNumbers, message);
                results.push({ phone: phoneNumbers, res, message: message, bulk: true, list: uniqueUsers.map(u => u.contact) });
            }
            totalCount = uniqueUsers.length;
        } else {
            // Single recipient logic
            const recipientsList = Array.isArray(recipients) 
                ? recipients 
                : typeof recipients === 'string' 
                    ? recipients.split(',').map(r => r.trim()).filter(Boolean)
                    : [recipients];

            for (const phone of recipientsList) {
                const personalizedMsg = message.replace(/{{name}}/g, name || 'User');
                const res = await sendSingleSMS(phone, personalizedMsg);
                results.push({ phone, res, message: personalizedMsg });
            }
            totalCount = recipientsList.length;
        }

        // 4. Final Processing and Logging
        const allSuccessful = results.every(r => r.res.code === 'ok' || r.res.code === '1000' || r.res.status === 'success');
        
        // Flatten logs
        const logData = [];
        results.forEach(r => {
            if (r.bulk && r.list) {
                r.list.forEach(p => {
                    logData.push({
                        recipient_phone: p,
                        message_content: r.message,
                        status: allSuccessful ? 'success' : 'failed',
                        provider_response: r.res,
                        admin_id: user.id
                    });
                });
            } else {
                logData.push({
                    recipient_phone: r.phone,
                    message_content: r.message,
                    status: (r.res.code === 'ok' || r.res.code === '1000' || r.res.status === 'success') ? 'success' : 'failed',
                    provider_response: r.res,
                    admin_id: user.id
                });
            }
        });

        // Batch insert logs
        const logBatchSize = 100;
        for (let i = 0; i < logData.length; i += logBatchSize) {
            const batch = logData.slice(i, i + logBatchSize);
            const { error: logError } = await supabase.from('sms_logs').insert(batch);
            if (logError) console.error('Logging Error:', logError);
        }

        return NextResponse.json({ 
            success: allSuccessful, 
            count: totalCount,
            results: results.length === 1 ? results[0].res : 'Multi-send completed'
        });

    } catch (error) {
        console.error('SMS Error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
