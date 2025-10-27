import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { BarChart3, TrendingUp, Users, MapPin, Monitor, DollarSign, Target, Award, Activity } from 'lucide-react';

const ReportsModern = () => {
  const [machines, setMachines] = useState([]);
  const [clients, setClients] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [machineReport, setMachineReport] = useState(null);
  const [clientReport, setClientReport] = useState(null);
  const [regionReport, setRegionReport] = useState(null);

  useEffect(() => {
    fetchMachines();
    fetchClients();
    fetchRegions();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await axios.get(`${API}/machines`, { headers: getAuthHeaders() });
      setMachines(response.data);
    } catch (error) {
      toast.error('Erro ao carregar máquinas');
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, { headers: getAuthHeaders() });
      setClients(response.data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await axios.get(`${API}/regions`, { headers: getAuthHeaders() });
      setRegions(response.data);
    } catch (error) {
      toast.error('Erro ao carregar regiões');
    }
  };

  const fetchMachineReport = async (machineId) => {
    try {
      const response = await axios.get(`${API}/reports/by-machine/${machineId}`, { headers: getAuthHeaders() });
      setMachineReport(response.data);
    } catch (error) {
      toast.error('Erro ao carregar relatório');
    }
  };

  const fetchClientReport = async (clientId) => {
    try {
      const response = await axios.get(`${API}/reports/by-client/${clientId}`, { headers: getAuthHeaders() });
      setClientReport(response.data);
    } catch (error) {
      toast.error('Erro ao carregar relatório');
    }
  };

  const fetchRegionReport = async (regionId) => {
    try {
      const response = await axios.get(`${API}/reports/by-region/${regionId}`, { headers: getAuthHeaders() });
      setRegionReport(response.data);
    } catch (error) {
      toast.error('Erro ao carregar relatório');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
          Central de Relatórios
        </h1>
        <p className="text-slate-300 mt-2">Análises detalhadas e insights estratégicos</p>
      </div>

      <Tabs defaultValue="machine" className="w-full">
        <TabsList className="bg-slate-800/60 border-2 border-yellow-500 p-1">
          <TabsTrigger 
            value="machine" 
            data-testid="machine-tab" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
          >
            <Monitor className="mr-2" size={16} />
            Por Máquina
          </TabsTrigger>
          <TabsTrigger 
            value="client" 
            data-testid="client-tab" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
          >
            <Users className="mr-2" size={16} />
            Por Cliente
          </TabsTrigger>
          <TabsTrigger 
            value="region" 
            data-testid="region-tab" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
          >
            <MapPin className="mr-2" size={16} />
            Por Região
          </TabsTrigger>
        </TabsList>

        {/* Machine Report */}
        <TabsContent value="machine" className="mt-6 space-y-6">
          <Card className="bg-gradient-to-br from-blue-900/90 to-cyan-900/90 border-2 border-yellow-500 shadow-2xl">
            <CardHeader className="border-b-2 border-yellow-500/30">
              <CardTitle className="flex items-center gap-2 text-white text-2xl">
                <Monitor className="text-yellow-400" size={28} />
                Análise por Máquina
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                <Select value={selectedMachine} onValueChange={(value) => { setSelectedMachine(value); fetchMachineReport(value); }}>
                  <SelectTrigger data-testid="machine-report-select" className="bg-slate-700 border-yellow-500 text-white h-12 text-lg">
                    <SelectValue placeholder="Selecione uma máquina" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-yellow-500">
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.code} - {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {machineReport && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-green-600 to-emerald-700 border-2 border-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm mb-1">Total de Leituras</p>
                            <p className="text-4xl font-bold text-white">{machineReport.total_readings}</p>
                          </div>
                          <Activity size={40} className="text-yellow-300" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm mb-1">Receita Bruta</p>
                            <p className="text-4xl font-bold text-white">R$ {machineReport.total_gross.toFixed(2)}</p>
                          </div>
                          <DollarSign size={40} className="text-yellow-300" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-600 to-pink-700 border-2 border-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm mb-1">Lucro Líquido</p>
                            <p className="text-4xl font-bold text-white">R$ {machineReport.total_net.toFixed(2)}</p>
                          </div>
                          <Target size={40} className="text-yellow-300" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-slate-800/60 border-2 border-yellow-500/50">
                    <CardHeader className="border-b border-yellow-500/30">
                      <CardTitle className="text-white">Últimas 10 Leituras</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {machineReport.readings.slice(0, 10).map((reading) => (
                          <div key={reading.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-800/40 to-indigo-800/40 border border-yellow-400/30 hover:border-yellow-400 transition-all">
                            <div>
                              <p className="text-white font-semibold">{format(new Date(reading.reading_date), 'dd/MM/yyyy HH:mm')}</p>
                              <p className="text-sm text-blue-200">In: {reading.current_in.toFixed(0)} | Out: {reading.current_out.toFixed(0)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-400">R$ {reading.gross_value.toFixed(2)}</p>
                              <p className="text-sm text-blue-300">Líq: R$ {reading.net_value.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Report */}
        <TabsContent value="client" className="mt-6 space-y-6">
          <Card className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 border-2 border-yellow-500 shadow-2xl">
            <CardHeader className="border-b-2 border-yellow-500/30">
              <CardTitle className="flex items-center gap-2 text-white text-2xl">
                <Users className="text-yellow-400" size={28} />
                Análise por Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                <Select value={selectedClient} onValueChange={(value) => { setSelectedClient(value); fetchClientReport(value); }}>
                  <SelectTrigger data-testid="client-report-select" className="bg-slate-700 border-yellow-500 text-white h-12 text-lg">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-yellow-500">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {clientReport && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-cyan-600 to-blue-700 border-2 border-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-cyan-100 text-sm mb-1">Máquinas</p>
                            <p className="text-4xl font-bold text-white">{clientReport.machines.length}</p>
                          </div>
                          <Monitor size={40} className="text-yellow-300" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-600 to-emerald-700 border-2 border-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm mb-1">Receita Total</p>
                            <p className="text-4xl font-bold text-white">R$ {clientReport.total_gross.toFixed(2)}</p>
                          </div>
                          <TrendingUp size={40} className="text-yellow-300" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-600 to-red-700 border-2 border-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-sm mb-1">Comissão</p>
                            <p className="text-4xl font-bold text-white">R$ {clientReport.total_commission.toFixed(2)}</p>
                          </div>
                          <Award size={40} className="text-yellow-300" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-slate-800/60 border-2 border-yellow-500/50">
                    <CardHeader className="border-b border-yellow-500/30">
                      <CardTitle className="text-white">Máquinas do Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {clientReport.machines.map((machine) => (
                          <div key={machine.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-800/40 to-pink-800/40 border border-yellow-400/30">
                            <div>
                              <p className="text-white font-bold">{machine.code}</p>
                              <p className="text-sm text-purple-200">{machine.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-yellow-400 font-bold">×{machine.multiplier}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Region Report */}
        <TabsContent value="region" className="mt-6 space-y-6">
          <Card className="bg-gradient-to-br from-orange-900/90 to-red-900/90 border-2 border-yellow-500 shadow-2xl">
            <CardHeader className="border-b-2 border-yellow-500/30">
              <CardTitle className="flex items-center gap-2 text-white text-2xl">
                <MapPin className="text-yellow-400" size={28} />
                Análise por Região
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                <Select value={selectedRegion} onValueChange={(value) => { setSelectedRegion(value); fetchRegionReport(value); }}>
                  <SelectTrigger data-testid="region-report-select" className="bg-slate-700 border-yellow-500 text-white h-12 text-lg">
                    <SelectValue placeholder="Selecione uma região" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-yellow-500">
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {regionReport && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-2 border-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-indigo-100 text-sm mb-1">Máquinas na Região</p>
                            <p className="text-4xl font-bold text-white">{regionReport.total_machines}</p>
                          </div>
                          <Monitor size={40} className="text-yellow-300" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-600 to-emerald-700 border-2 border-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm mb-1">Receita Total</p>
                            <p className="text-4xl font-bold text-white">R$ {regionReport.total_gross.toFixed(2)}</p>
                          </div>
                          <DollarSign size={40} className="text-yellow-300" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-600 to-cyan-700 border-2 border-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm mb-1">Lucro Líquido</p>
                            <p className="text-4xl font-bold text-white">R$ {regionReport.total_net.toFixed(2)}</p>
                          </div>
                          <Target size={40} className="text-yellow-300" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-slate-800/60 border-2 border-yellow-500/50">
                    <CardHeader className="border-b border-yellow-500/30">
                      <CardTitle className="text-white">Máquinas na Região</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {regionReport.machines.map((machine) => (
                          <div key={machine.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-800/40 to-red-800/40 border border-yellow-400/30">
                            <div>
                              <p className="text-white font-bold">{machine.code}</p>
                              <p className="text-sm text-orange-200">{machine.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-yellow-400 font-bold">×{machine.multiplier}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsModern;