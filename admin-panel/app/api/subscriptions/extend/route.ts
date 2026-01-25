import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    const { companyId, days } = await request.json();

    if (!companyId || !days) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Get current subscription
    const { data: currentSub, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .order('end_date', { ascending: false })
        .limit(1)
        .single();

    if (fetchError || !currentSub) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // 2. Calculate new end date
    const currentEndDate = new Date(currentSub.end_date);
    const newEndDate = new Date(Math.max(currentEndDate.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000);

    // 3. Update subscription
    const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
            end_date: newEndDate.toISOString(),
            status: 'ACTIVE'
        })
        .eq('id', currentSub.id);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, newEndDate: newEndDate.toISOString() });
}
