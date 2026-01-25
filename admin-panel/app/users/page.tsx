import { ShieldAlert, Users, Building2, PowerOff, Search } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';

async function getUsers() {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select(`
      *,
      companies ( name ),
      active_sessions ( device_id, last_active )
    `)
        .order('created_at', { ascending: false });

    return data || [];
}

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 h-screen bg-[#1e293b] border-r border-slate-800 p-6 fixed">
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">SAMBAD <span className="text-blue-500">ADMIN</span></h1>
                    </div>
                    <nav className="space-y-1">
                        <a href="/" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
                            <Building2 className="w-5 h-5" /> Companies
                        </a>
                        <a href="/users" className="flex items-center gap-3 px-3 py-2 bg-blue-600/10 text-blue-400 rounded-lg font-medium">
                            <Users className="w-5 h-5" /> All Users
                        </a>
                    </nav>
                </aside>

                <main className="flex-1 ml-64 p-10">
                    <header className="mb-10">
                        <h2 className="text-3xl font-bold text-white">User Management</h2>
                        <p className="text-slate-400">View all registered users and manage their active sessions.</p>
                    </header>

                    <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" /> System Users ({users.length})
                            </h3>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input className="bg-slate-900 border border-slate-700 text-sm pl-10 pr-4 py-2 rounded-xl outline-none focus:border-blue-500 transition-all w-64" placeholder="Filter by email or name..." />
                            </div>
                        </div>

                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Full Name / Email</th>
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4">Role / Session</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {users.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold group-hover:border-blue-500/50 transition-all">
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{user.full_name}</p>
                                                    <p className="text-xs text-slate-500 font-mono tracking-tighter">{user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-300 font-medium">{user.companies?.name || '---'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${user.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-700 text-slate-400'}`}>{user.role}</span>
                                                    {user.active_sessions?.length > 0 ? (
                                                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ONLINE
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Offline</span>
                                                    )}
                                                </div>
                                                {user.active_sessions?.[0] && (
                                                    <span className="text-[10px] text-slate-500 font-mono">Last Dev: {user.active_sessions[0].device_id.substring(0, 8)}...</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white flex items-center gap-2 float-right">
                                                <PowerOff className="w-3.5 h-3.5" /> Force Logout
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}
