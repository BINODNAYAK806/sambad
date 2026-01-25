import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    const { userId } = await request.json();

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Delete active sessions for the user
    const { error } = await supabaseAdmin
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'User sessions cleared' });
}
