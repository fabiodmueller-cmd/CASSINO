import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Users, UserCog, TrendingUp, DollarSign, FileText, Calendar, ArrowUpRight, ArrowDownRight, AlertCircle, Activity, Zap, Target } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentReadings, setRecentReadings] = useState([]);
  const [topMachines, setTopMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(7);

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
      
      // Pegar últimas 5 leituras com informações da máquina e cliente
      const sorted = readingsRes.data.sort((a, b) => 
        new Date(b.reading_date) - new Date(a.reading_date)
      );
      
      // Filtrar por dias
      const now = new Date();
      const daysAgo = new Date(now.getTime() - (daysFilter * 24 * 60 * 60 * 1000));
      const filtered = sorted.filter(r => new Date(r.reading_date) >= daysAgo);
      
      const enrichedReadings = filtered.slice(0, 5).map(reading => {
        const machine = machinesRes.data.find(m => m.id === reading.machine_id);
        const client = clientsRes.data.find(c => c.id === machine?.client_id);
        return {
          ...reading,
          machineName: machine ? `${machine.code} - ${machine.name}` : 'N/A',
          clientName: client?.name || 'N/A'
        };
      });
      
      setRecentReadings(enrichedReadings);
      
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
        <Card className="bg-gradient-to-br from-green-600 to-emerald-700 border-2 border-yellow-500 hover:scale-105 transition-transform cursor-pointer shadow-2xl shadow-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-yellow-400/30 shadow-lg">
                <TrendingUp size={28} className="text-yellow-200" />
              </div>
              <div className="flex items-center gap-1 text-yellow-300 text-sm font-semibold bg-yellow-900/40 px-3 py-1 rounded-full">
                <ArrowUpRight size={18} />
                <span>100%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-green-100 mb-1 font-medium">Receita Bruta</p>
              <p className="text-3xl font-bold text-white">
                R$ {(stats?.total_gross || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-green-200 mt-2">Total de entrada</p>
            </div>
          </CardContent>
        </Card>

        {/* Comissões */}
        <Card className="bg-gradient-to-br from-orange-600 to-red-700 border-2 border-yellow-500 hover:scale-105 transition-transform cursor-pointer shadow-2xl shadow-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-yellow-400/30 shadow-lg">
                <DollarSign size={28} className="text-yellow-200" />
              </div>
              <div className="flex items-center gap-1 text-yellow-300 text-sm font-semibold bg-yellow-900/40 px-3 py-1 rounded-full">
                <ArrowDownRight size={18} />
                <span>{percentages.commissionsPercent}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-orange-100 mb-1 font-medium">Total Comissões</p>
              <p className="text-3xl font-bold text-white">
                R$ {(stats?.total_commissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-orange-200 mt-2">Clientes + Operadores</p>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-yellow-500 hover:scale-105 transition-transform cursor-pointer shadow-2xl shadow-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-yellow-400/30 shadow-lg">
                <Target size={28} className="text-yellow-200" />
              </div>
              <div className="flex items-center gap-1 text-yellow-300 text-sm font-semibold bg-yellow-900/40 px-3 py-1 rounded-full">
                <ArrowUpRight size={18} />
                <span>{percentages.netPercent}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-blue-100 mb-1 font-medium">Lucro Líquido</p>
              <p className="text-3xl font-bold text-white">
                R$ {(stats?.total_net || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-blue-200 mt-2">Margem: {percentages.profitMargin}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Leituras */}
        <Card className="bg-gradient-to-br from-purple-600 to-pink-700 border-2 border-yellow-500 hover:scale-105 transition-transform cursor-pointer shadow-2xl shadow-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-yellow-400/30 shadow-lg">
                <FileText size={28} className="text-yellow-200" />
              </div>
              <div className="flex items-center gap-1 text-yellow-300 text-sm bg-yellow-900/40 px-3 py-1 rounded-full">
                <Zap size={18} />
              </div>
            </div>
            <div>
              <p className="text-sm text-purple-100 mb-1 font-medium">Total Leituras</p>
              <p className="text-3xl font-bold text-white">{stats?.total_readings || 0}</p>
              <p className="text-xs text-purple-200 mt-2">Média: R$ {avgPerReading.toFixed(2)}</p>
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="text-yellow-400" size={24} />
                Últimas Leituras
              </CardTitle>
              <Select value={daysFilter.toString()} onValueChange={(value) => setDaysFilter(Number(value))}>
                <SelectTrigger className="w-32 bg-slate-700 border-yellow-500 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-yellow-500">
                  <SelectItem value="1">Hoje</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recentReadings.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-green-500/20 border border-green-400/30">
                  <p className="text-xs text-green-200">Total Bruto</p>
                  <p className="text-xl font-bold text-green-300">
                    R$ {recentReadings.reduce((acc, r) => acc + r.gross_value, 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
                  <p className="text-xs text-blue-200">Total Líquido</p>
                  <p className="text-xl font-bold text-blue-300">
                    R$ {recentReadings.reduce((acc, r) => acc + r.net_value, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
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
                    <p className="text-sm text-purple-100 mt-1">{reading.machineName}</p>
                    <p className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                      <Users size={12} />
                      {reading.clientName}
                    </p>
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