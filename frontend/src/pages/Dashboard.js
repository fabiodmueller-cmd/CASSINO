import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Users, UserCog, TrendingUp, DollarSign, FileText, Calendar, ArrowUpRight, ArrowDownRight, AlertCircle, Activity, Zap, Target } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentReadings, setRecentReadings] = useState([]);
  const [topMachines, setTopMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsRes, readingsRes, machinesRes, clientsRes] = await Promise.all([
        axios.get(`${API}/reports/dashboard`, { headers: getAuthHeaders() }),
        axios.get(`${API}/readings`, { headers: getAuthHeaders() }),
        axios.get(`${API}/machines`, { headers: getAuthHeaders() }),
        axios.get(`${API}/clients`, { headers: getAuthHeaders() })
      ]);
      
      setStats(statsRes.data);
      
      // Pegar últimas 5 leituras
      const sorted = readingsRes.data.sort((a, b) => 
        new Date(b.reading_date) - new Date(a.reading_date)
      );
      setRecentReadings(sorted.slice(0, 5));
      
      // Top 5 máquinas por valor bruto
      const machineRevenue = {};
      readingsRes.data.forEach(r => {
        if (!machineRevenue[r.machine_id]) {
          machineRevenue[r.machine_id] = 0;
        }
        machineRevenue[r.machine_id] += r.gross_value;
      });
      
      const topMachinesList = Object.entries(machineRevenue)
        .map(([id, revenue]) => {
          const machine = machinesRes.data.find(m => m.id === id);
          const client = clientsRes.data.find(c => c.id === machine?.client_id);
          return machine ? { ...machine, revenue, clientName: client?.name || 'N/A' } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      setTopMachines(topMachinesList);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Carregando central de operações...</div>
      </div>
    );
  }

  const calculatePercentages = () => {
    const gross = stats?.total_gross || 0;
    const commissions = stats?.total_commissions || 0;
    const net = stats?.total_net || 0;
    
    return {
      commissionsPercent: gross > 0 ? ((commissions / gross) * 100).toFixed(1) : 0,
      netPercent: gross > 0 ? ((net / gross) * 100).toFixed(1) : 0,
      profitMargin: gross > 0 ? ((net / gross) * 100).toFixed(1) : 0
    };
  };

  const percentages = calculatePercentages();
  const avgPerReading = stats?.total_readings > 0 ? stats.total_net / stats.total_readings : 0;
  const avgPerMachine = stats?.total_machines > 0 ? stats.total_net / stats.total_machines : 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Central de Operações
          </h1>
          <p className="text-slate-400 mt-2">Visão completa do seu império em tempo real</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
          <Activity className="text-blue-400" size={20} />
          <span className="text-sm text-slate-300">Sistema Ativo</span>
        </div>
      </div>

      {/* Main Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor Bruto */}
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/30 border-green-500/40 hover:scale-105 transition-transform cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/30 backdrop-blur-sm">
                <TrendingUp size={28} className="text-green-300" />
              </div>
              <div className="flex items-center gap-1 text-green-300 text-sm font-semibold">
                <ArrowUpRight size={18} />
                <span>100%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-300 mb-1 font-medium">Receita Bruta</p>
              <p className="text-3xl font-bold text-white">
                R$ {(stats?.total_gross || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-green-300 mt-2">Total de entrada</p>
            </div>
          </CardContent>
        </Card>

        {/* Comissões */}
        <Card className="bg-gradient-to-br from-orange-500/20 to-red-600/30 border-orange-500/40 hover:scale-105 transition-transform cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-500/30 backdrop-blur-sm">
                <DollarSign size={28} className="text-orange-300" />
              </div>
              <div className="flex items-center gap-1 text-orange-300 text-sm font-semibold">
                <ArrowDownRight size={18} />
                <span>{percentages.commissionsPercent}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-300 mb-1 font-medium">Total Comissões</p>
              <p className="text-3xl font-bold text-white">
                R$ {(stats?.total_commissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-orange-300 mt-2">Clientes + Operadores</p>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card className="bg-gradient-to-br from-blue-500/20 to-purple-600/30 border-blue-500/40 hover:scale-105 transition-transform cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/30 backdrop-blur-sm">
                <Target size={28} className="text-blue-300" />
              </div>
              <div className="flex items-center gap-1 text-blue-300 text-sm font-semibold">
                <ArrowUpRight size={18} />
                <span>{percentages.netPercent}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-300 mb-1 font-medium">Lucro Líquido</p>
              <p className="text-3xl font-bold text-white">
                R$ {(stats?.total_net || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-blue-300 mt-2">Margem: {percentages.profitMargin}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Leituras */}
        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-600/30 border-purple-500/40 hover:scale-105 transition-transform cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/30 backdrop-blur-sm">
                <FileText size={28} className="text-purple-300" />
              </div>
              <div className="flex items-center gap-1 text-purple-300 text-sm">
                <Zap size={18} />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-300 mb-1 font-medium">Total Leituras</p>
              <p className="text-3xl font-bold text-white">{stats?.total_readings || 0}</p>
              <p className="text-xs text-purple-300 mt-2">Média: R$ {avgPerReading.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/60 border-slate-700 hover:border-blue-500/50 transition-colors backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Monitor size={32} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Máquinas Ativas</p>
                <p className="text-3xl font-bold text-white">{stats?.total_machines || 0}</p>
                <p className="text-xs text-blue-400 mt-1">R$ {avgPerMachine.toFixed(2)}/máq</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700 hover:border-purple-500/50 transition-colors backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Users size={32} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Clientes</p>
                <p className="text-3xl font-bold text-white">{stats?.total_clients || 0}</p>
                <p className="text-xs text-purple-400 mt-1">Ativos no sistema</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700 hover:border-green-500/50 transition-colors backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <UserCog size={32} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Operadores</p>
                <p className="text-3xl font-bold text-white">{stats?.total_operators || 0}</p>
                <p className="text-xs text-green-400 mt-1">Em operação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700 hover:border-yellow-500/50 transition-colors backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                <Activity size={32} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Taxa Operacional</p>
                <p className="text-3xl font-bold text-white">{percentages.profitMargin}%</p>
                <p className="text-xs text-yellow-400 mt-1">Margem líquida</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Máquinas */}
        <Card className="bg-gradient-to-br from-blue-900/90 to-indigo-900/90 border-2 border-yellow-500 shadow-2xl shadow-yellow-500/20">
          <CardHeader className="border-b border-yellow-500/30">
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="text-yellow-400" size={24} />
              Top 5 Máquinas por Receita
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {topMachines.map((machine, index) => (
                <div
                  key={machine.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-800/60 to-indigo-800/60 border-2 border-yellow-400/40 hover:border-yellow-400 transition-all hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/20"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900' :
                      'bg-gradient-to-br from-blue-400 to-blue-600 text-blue-900'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{machine.code}</p>
                      <p className="text-sm text-blue-200">{machine.name}</p>
                      <p className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                        <Users size={12} />
                        {machine.clientName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-400">
                      R$ {machine.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-blue-300">Mult: {machine.multiplier}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Últimas Leituras */}
        <Card className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 border-2 border-yellow-500 shadow-2xl shadow-yellow-500/20">
          <CardHeader className="border-b border-yellow-500/30">
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="text-yellow-400" size={24} />
              Últimas Leituras
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {recentReadings.map((reading) => (
                <div
                  key={reading.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-800/60 to-pink-800/60 border-2 border-yellow-400/40 hover:border-yellow-400 transition-all hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/20"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {format(new Date(reading.reading_date), 'dd/MM/yyyy HH:mm')}
                    </p>
                    <p className="text-xs text-purple-200 mt-1">ID: {reading.machine_id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">
                      R$ {reading.gross_value.toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-300">
                      Líq: R$ {reading.net_value.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats?.total_machines === 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-400" size={32} />
              <div>
                <p className="font-semibold text-yellow-300">Atenção!</p>
                <p className="text-sm text-slate-300">Nenhuma máquina cadastrada no sistema. Adicione máquinas para começar.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Importar Trophy
import { Trophy } from 'lucide-react';

export default Dashboard;