import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Users, UserCog, TrendingUp, DollarSign, FileText, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

  const calculatePercentages = () => {
    const gross = stats?.total_gross || 0;
    const commissions = stats?.total_commissions || 0;
    const net = stats?.total_net || 0;
    
    return {
      commissionsPercent: gross > 0 ? ((commissions / gross) * 100).toFixed(1) : 0,
      netPercent: gross > 0 ? ((net / gross) * 100).toFixed(1) : 0
    };
  };

  const percentages = calculatePercentages();

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Painel</h1>
        <p className="page-subtitle">Visão geral do seu império de slots</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor Bruto */}
        <Card
          data-testid="stat-card-valor-bruto"
          className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30 hover:scale-105 transition-transform"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <TrendingUp size={24} className="text-green-400" />
              </div>
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUpRight size={16} />
                <span>100%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Valor Bruto</p>
              <p className="text-3xl font-bold text-white">
                R$ {(stats?.total_gross || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comissões */}
        <Card
          data-testid="stat-card-comissoes"
          className="bg-gradient-to-br from-orange-500/20 to-red-600/20 border-orange-500/30 hover:scale-105 transition-transform"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-500/20">
                <DollarSign size={24} className="text-orange-400" />
              </div>
              <div className="flex items-center gap-1 text-orange-400 text-sm">
                <span>{percentages.commissionsPercent}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Comissões</p>
              <p className="text-3xl font-bold text-white">
                R$ {(stats?.total_commissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Valor Líquido */}
        <Card
          data-testid="stat-card-valor-liquido"
          className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-blue-500/30 hover:scale-105 transition-transform"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <DollarSign size={24} className="text-blue-400" />
              </div>
              <div className="flex items-center gap-1 text-blue-400 text-sm">
                <ArrowUpRight size={16} />
                <span>{percentages.netPercent}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Lucro Líquido</p>
              <p className="text-3xl font-bold text-white">
                R$ {(stats?.total_net || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Leituras */}
        <Card
          data-testid="stat-card-leituras"
          className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-purple-500/30 hover:scale-105 transition-transform"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <FileText size={24} className="text-purple-400" />
              </div>
              <div className="flex items-center gap-1 text-purple-400 text-sm">
                <Calendar size={16} />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Leituras</p>
              <p className="text-3xl font-bold text-white">{stats?.total_readings || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Máquinas Ativas */}
        <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-blue-500/10">
                <Monitor size={28} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Máquinas Ativas</p>
                <p className="text-2xl font-bold text-white">{stats?.total_machines || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clientes */}
        <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-purple-500/10">
                <Users size={28} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Clientes</p>
                <p className="text-2xl font-bold text-white">{stats?.total_clients || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operadores */}
        <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-green-500/10">
                <UserCog size={28} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Operadores</p>
                <p className="text-2xl font-bold text-white">{stats?.total_operators || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;