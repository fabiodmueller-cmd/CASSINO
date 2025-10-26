import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { BarChart3, TrendingUp, Users, MapPin } from 'lucide-react';

const Reports = () => {
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
      const response = await axios.get(`${API}/machines`, {
        headers: getAuthHeaders(),
      });
      setMachines(response.data);
    } catch (error) {
      toast.error('Erro ao carregar máquinas');
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, {
        headers: getAuthHeaders(),
      });
      setClients(response.data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await axios.get(`${API}/regions`, {
        headers: getAuthHeaders(),
      });
      setRegions(response.data);
    } catch (error) {
      toast.error('Erro ao carregar regiões');
    }
  };

  const fetchMachineReport = async (machineId) => {
    try {
      const response = await axios.get(`${API}/reports/by-machine/${machineId}`, {
        headers: getAuthHeaders(),
      });
      setMachineReport(response.data);
    } catch (error) {
      toast.error('Erro ao carregar relatório');
    }
  };

  const fetchClientReport = async (clientId) => {
    try {
      const response = await axios.get(`${API}/reports/by-client/${clientId}`, {
        headers: getAuthHeaders(),
      });
      setClientReport(response.data);
    } catch (error) {
      toast.error('Erro ao carregar relatório');
    }
  };

  const fetchRegionReport = async (regionId) => {
    try {
      const response = await axios.get(`${API}/reports/by-region/${regionId}`, {
        headers: getAuthHeaders(),
      });
      setRegionReport(response.data);
    } catch (error) {
      toast.error('Erro ao carregar relatório');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Relatórios</h1>
        <p className="page-subtitle">Análise detalhada de desempenho</p>
      </div>

      <Tabs defaultValue="machine" className="w-full">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="machine" data-testid="machine-tab" className="data-[state=active]:bg-blue-500">
            <BarChart3 className="mr-2" size={16} />
            Por Máquina
          </TabsTrigger>
          <TabsTrigger value="client" data-testid="client-tab" className="data-[state=active]:bg-purple-500">
            <Users className="mr-2" size={16} />
            Por Cliente
          </TabsTrigger>
          <TabsTrigger value="region" data-testid="region-tab" className="data-[state=active]:bg-green-500">
            <MapPin className="mr-2" size={16} />
            Por Região
          </TabsTrigger>
        </TabsList>

        {/* Machine Report */}
        <TabsContent value="machine" className="mt-6">
          <Card className="glass-card border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Relatório por Máquina</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Select
                  value={selectedMachine}
                  onValueChange={(value) => {
                    setSelectedMachine(value);
                    fetchMachineReport(value);
                  }}
                >
                  <SelectTrigger data-testid="machine-report-select" className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione uma máquina" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
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
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Total de Leituras</div>
                      <div className="text-2xl font-bold text-white mt-1">
                        {machineReport.total_readings}
                      </div>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Valor Bruto Total</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        R$ {machineReport.total_gross.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Valor Líquido Total</div>
                      <div className="text-2xl font-bold text-blue-400 mt-1">
                        R$ {machineReport.total_net.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="table-container">
                    <h3 className="text-lg font-bold text-white mb-3">Histórico de Leituras</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Entrada</th>
                          <th>Saída</th>
                          <th>Valor Bruto</th>
                          <th>Valor Líquido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {machineReport.readings.map((reading) => (
                          <tr key={reading.id}>
                            <td>{format(new Date(reading.reading_date), 'dd/MM/yyyy HH:mm')}</td>
                            <td>{reading.current_in.toFixed(2)}</td>
                            <td>{reading.current_out.toFixed(2)}</td>
                            <td className="text-green-400">R$ {reading.gross_value.toFixed(2)}</td>
                            <td className="text-blue-400">R$ {reading.net_value.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Report */}
        <TabsContent value="client" className="mt-6">
          <Card className="glass-card border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Relatório por Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Select
                  value={selectedClient}
                  onValueChange={(value) => {
                    setSelectedClient(value);
                    fetchClientReport(value);
                  }}
                >
                  <SelectTrigger data-testid="client-report-select" className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
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
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Máquinas</div>
                      <div className="text-2xl font-bold text-white mt-1">
                        {clientReport.machines.length}
                      </div>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Valor Bruto Total</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        R$ {clientReport.total_gross.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Comissão Total</div>
                      <div className="text-2xl font-bold text-orange-400 mt-1">
                        R$ {clientReport.total_commission.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="table-container">
                    <h3 className="text-lg font-bold text-white mb-3">Máquinas do Cliente</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nome</th>
                          <th>Multiplicador</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientReport.machines.map((machine) => (
                          <tr key={machine.id}>
                            <td>{machine.code}</td>
                            <td>{machine.name}</td>
                            <td>{machine.multiplier}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Region Report */}
        <TabsContent value="region" className="mt-6">
          <Card className="glass-card border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Relatório por Região</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Select
                  value={selectedRegion}
                  onValueChange={(value) => {
                    setSelectedRegion(value);
                    fetchRegionReport(value);
                  }}
                >
                  <SelectTrigger data-testid="region-report-select" className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione uma região" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
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
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Máquinas na Região</div>
                      <div className="text-2xl font-bold text-white mt-1">
                        {regionReport.total_machines}
                      </div>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Valor Bruto Total</div>
                      <div className="text-2xl font-bold text-green-400 mt-1">
                        R$ {regionReport.total_gross.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="text-slate-400 text-sm">Valor Líquido Total</div>
                      <div className="text-2xl font-bold text-blue-400 mt-1">
                        R$ {regionReport.total_net.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="table-container">
                    <h3 className="text-lg font-bold text-white mb-3">Máquinas na Região</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nome</th>
                          <th>Multiplicador</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regionReport.machines.map((machine) => (
                          <tr key={machine.id}>
                            <td>{machine.code}</td>
                            <td>{machine.name}</td>
                            <td>{machine.multiplier}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
