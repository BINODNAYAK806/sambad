import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    const { companyId, suspend } = await request.json();

    if (!companyId) {
        return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    // Update company status - assuming companies table exists with status field
    const { error } = await supabaseAdmin
        .from('companies')
        .update({
            status: suspend ? 'SUSPENDED' : 'ACTIVE'
        })
        .eq('id', companyId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If suspending, also force logout all users from this company
    if (suspend) {
        const { data: users } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('company_id', companyId);

        if (users && users.length > 0) {
            const userIds = users.map(u => u.id);
            await supabaseAdmin
                .from('active_sessions')
                .delete()
                .in('user_id', userIds);
        }
    }
    return NextResponse.json({ success: true, status: suspend ? 'SUSPENDED' : 'ACTIVE' });
}
