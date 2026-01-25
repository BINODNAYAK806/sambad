import { Building2, Users, CreditCard, ShieldAlert, TrendingUp } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';

async function getStats() {
    const { count: companyCount } = await supabaseAdmin.from('companies').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    const { data: dailyActive } = await supabaseAdmin.from('active_sessions').select('user_id', { count: 'exact', head: true });

    return {
        totalCompanies: companyCount || 0,
        totalUsers: userCount || 0,
        activeSessions: dailyActive?.length || 0,
    };
}

async function getCompanies() {
    const { data, error } = await supabaseAdmin
        .from('companies')
        .select(`
      *,
      subscriptions (
        plan_id,
        status,
        end_date
      )
    `)
        .order('created_at', { ascending: false })
        .limit(10);

    return data || [];
}

export default async function Dashboard() {
    const stats = await getStats();
    const companies = await getCompanies();

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
                        <a href="/" className="flex items-center gap-3 px-3 py-2 bg-blue-600/10 text-blue-400 rounded-lg font-medium">
                            <Building2 className="w-5 h-5" /> Companies
                        </a>
                        <a href="/users" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
                            <Users className="w-5 h-5" /> All Users
                        </a>
                    </nav>
                </aside>

                <main className="flex-1 ml-64 p-10">
                    <header className="mb-10 flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Super Admin Dashboard</h2>
                            <p className="text-slate-400">Live monitoring of the SAMBAD ecosystem.</p>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {[
                            { label: 'Registered Companies', value: stats.totalCompanies, icon: Building2, color: 'text-blue-500' },
                            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-emerald-500' },
                            { label: 'Active Sessions', value: stats.activeSessions, icon: TrendingUp, color: 'text-amber-500' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 bg-slate-800 rounded-xl ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-slate-400 font-medium mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Companies Table */}
                    <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Recent Companies</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Company Name</th>
                                    <th className="px-6 py-4">Plan / Expiry</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {companies.map((company: any) => {
                                    const sub = company.subscriptions?.[0]; // Get latest sub
                                    const isExpired = sub ? new Date(sub.end_date) < new Date() : true;

                                    return (
                                        <tr key={company.id} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-white">{company.name}</p>
                                                <p className="text-xs text-slate-500 uppercase tracking-tighter">{company.id}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-slate-300">{sub?.plan_id || 'NO PLAN'}</span>
                                                    {sub && <span className="text-[10px] text-slate-500 font-mono">End: {new Date(sub.end_date).toLocaleDateString()}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${isExpired ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                                    {isExpired ? 'Expired' : 'Active'}
                                                </span>
                                                {company.status === 'SUSPENDED' && (
                                                    <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-900/50 text-white">SUSPENDED</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-4 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="text-blue-500 hover:text-blue-400 text-sm font-bold tracking-tight">Manage</button>
                                                    <button className="text-red-500 hover:text-red-400 text-sm font-bold tracking-tight">
                                                        {company.status === 'SUSPENDED' ? 'Resume' : 'Suspend'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {companies.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-slate-500">No companies found in database.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}
