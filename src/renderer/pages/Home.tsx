import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Users, TrendingUp, MessageSquare, Terminal, ArrowUpRight, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WhatsAppStatusOverview } from '../components/WhatsAppStatusOverview';

export function Home() {
  const navigate = useNavigate();
  // Dialogs are now handled globally in DashboardLayout
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRuns: 0,
    totalMessages: 0,
    messagesSent: 0,
    messagesFailed: 0,
    successRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      const [contactsResult, campaignsResult, runsResult] = await Promise.all([
        window.electronAPI.contacts.list(),
        window.electronAPI.campaigns.list(),
        window.electronAPI.campaignRuns.list(),
      ]);

      let totalSent = 0;
      let totalFailed = 0;
      let totalMessages = 0;
      let totalRuns = 0;
      let activeCampaigns = 0;

      if (campaignsResult.success && campaignsResult.data) {
        campaignsResult.data.forEach((campaign) => {
          if (campaign.status === 'running' || campaign.status === 'paused') {
            activeCampaigns++;
          }
        });
      }

      if (runsResult.success && runsResult.data) {
        const runs = runsResult.data;
        totalRuns = runs.length;
        totalMessages = runs.reduce((sum: number, r: any) => sum + (r.total_count || 0), 0);
        totalSent = runs.reduce((sum: number, r: any) => sum + (r.sent_count || 0), 0);
        totalFailed = runs.reduce((sum: number, r: any) => sum + (r.failed_count || 0), 0);
      }

      const completedMessages = totalSent + totalFailed;
      const successRate = completedMessages > 0 ? (totalSent / completedMessages) * 100 : 0;

      setStats({
        totalContacts: contactsResult.success ? (contactsResult.data?.length || 0) : 0,
        totalCampaigns: campaignsResult.success ? (campaignsResult.data?.length || 0) : 0,
        activeCampaigns,
        totalRuns,
        totalMessages,
        messagesSent: totalSent,
        messagesFailed: totalFailed,
        successRate: Math.round(successRate * 10) / 10,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    const handleUpdate = () => loadStats(true);

    if (window.electronAPI && window.electronAPI.on) {
      window.electronAPI.on('campaign:progress', handleUpdate);
      window.electronAPI.on('campaign:complete', handleUpdate);
      window.electronAPI.on('campaign:error', handleUpdate);
    }

    // Also poll every 5s just like Reports to be sure
    const interval = setInterval(() => loadStats(true), 5000);

    return () => {
      clearInterval(interval);
      if (window.electronAPI && window.electronAPI.removeListener) {
        window.electronAPI.removeListener('campaign:progress', handleUpdate);
        window.electronAPI.removeListener('campaign:complete', handleUpdate);
        window.electronAPI.removeListener('campaign:error', handleUpdate);
      }
    };
  }, []);

  const statCards = [
    {
      title: 'Total Runs',
      value: isLoading ? '...' : stats.totalRuns.toLocaleString(),
      description: 'Lifetime campaign runs',
      icon: TrendingUp,
      color: 'from-blue-500/10 to-blue-500/5',
      iconColor: 'text-blue-500',
      trend: '',
    },
    {
      title: 'Success Rate',
      value: isLoading ? '...' : `${stats.successRate}%`,
      description: 'Overall delivery success',
      icon: Sparkles,
      color: 'from-green-500/10 to-green-500/5',
      iconColor: 'text-green-500',
      trend: '',
    },
    {
      title: 'Failed Messages',
      value: isLoading ? '...' : stats.messagesFailed.toLocaleString(),
      description: `${stats.messagesSent} sent successfully`,
      icon: AlertCircle,
      color: 'from-red-500/10 to-red-500/5',
      iconColor: 'text-red-500',
      trend: '',
    },
    {
      title: 'Total Messages',
      value: isLoading ? '...' : stats.messagesSent.toLocaleString(),
      description: `${stats.activeCampaigns} active campaigns`,
      icon: MessageSquare,
      color: 'from-violet-500/10 to-violet-500/5',
      iconColor: 'text-violet-500',
      trend: '',
    },
  ];

  const quickActions = [
    {
      title: 'Add New Contacts',
      icon: Users,
      path: '/contacts',
      description: 'Import or add contacts',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Create Campaign',
      icon: Megaphone,
      path: '/campaigns',
      description: 'Start a new campaign',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'View Reports',
      icon: MessageSquare,
      path: '/reports',
      description: 'Analytics & insights',
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Open Console',
      icon: Terminal,
      path: '/console',
      description: 'System logs & debug',
      color: 'from-violet-500 to-violet-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to <span className="gradient-text">Wapro</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Smart Marketing . Safe Sending
          </p>
        </div>
        <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
          <Sparkles className="h-4 w-4" />
          Get Started
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="card-hover border-0 shadow-md overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-50 pointer-events-none`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-semibold">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-background/80 backdrop-blur-sm ${stat.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.trend}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <WhatsAppStatusOverview />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.path}
                  className="w-full justify-start h-auto p-4 group relative overflow-hidden"
                  variant="outline"
                  onClick={() => navigate(action.path)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`} />
                  <div className="flex items-center gap-3 relative">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'Campaign "Summer Sale" completed',
                  time: '2 hours ago',
                  color: 'bg-green-500',
                },
                {
                  title: '156 new contacts added',
                  time: '5 hours ago',
                  color: 'bg-blue-500',
                },
                {
                  title: 'Campaign "Newsletter" scheduled',
                  time: 'Yesterday',
                  color: 'bg-orange-500',
                },
                {
                  title: 'WhatsApp connection restored',
                  time: '2 days ago',
                  color: 'bg-violet-500',
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200 cursor-pointer group"
                >
                  <div className={`mt-1 h-2 w-2 rounded-full ${activity.color} shadow-lg`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
