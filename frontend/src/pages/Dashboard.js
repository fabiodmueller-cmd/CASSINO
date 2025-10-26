import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Users, UserCog, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/reports/dashboard`, {
        headers: getAuthHeaders(),
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Máquinas Ativas',
      value: stats?.total_machines || 0,
      icon: Monitor,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Clientes',
      value: stats?.total_clients || 0,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Operadores',
      value: stats?.total_operators || 0,
      icon: UserCog,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Leituras',
      value: stats?.total_readings || 0,
      icon: FileText,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Valor Bruto',
      value: `R$ ${(stats?.total_gross || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      title: 'Valor Líquido',
      value: `R$ ${(stats?.total_net || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'from-teal-500 to-green-500',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              data-testid={`stat-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="stat-card border-slate-700 bg-slate-800/50"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                  <Icon size={20} className="text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats?.total_commissions > 0 && (
        <Card className="mt-6 glass-card border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Total Bruto</span>
                <span className="text-xl font-bold text-green-400">
                  R$ {stats.total_gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Total Comissões</span>
                <span className="text-xl font-bold text-orange-400">
                  R$ {stats.total_commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Total Líquido</span>
                <span className="text-xl font-bold text-blue-400">
                  R$ {stats.total_net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
