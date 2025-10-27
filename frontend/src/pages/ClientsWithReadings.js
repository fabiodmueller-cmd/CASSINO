import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Users, DollarSign, Monitor, ChevronDown, ChevronUp, 
  CheckCircle, Clock, Calendar, FileText, History, 
  Receipt, Share2, ArrowRight, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientsWithReadings = () => {
  const [clients, setClients] = useState([]);
  const [machines, setMachines] = useState([]);
  const [links, setLinks] = useState([]);
  const [operators, setOperators] = useState([]);
  const [expandedClient, setExpandedClient] = useState(null);
  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [currentMachineIndex, setCurrentMachineIndex] = useState(0);
  const [clientMachines, setClientMachines] = useState([]);
  const [currentClient, setCurrentClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [readings, setReadings] = useState([]);
  const [completedReadings, setCompletedReadings] = useState([]);
  const navigate = useNavigate();
  
  const [readingForm, setReadingForm] = useState({
    previous_in: '',
    previous_out: '',
    current_in: '',
    current_out: '',
  });

  useEffect(() => {
    fetchClients();
    fetchMachines();
    fetchLinks();
    fetchReadings();
    fetchOperators();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, { headers: getAuthHeaders() });
      setClients(response.data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await axios.get(`${API}/machines`, { headers: getAuthHeaders() });
      setMachines(response.data);
    } catch (error) {
      toast.error('Erro ao carregar máquinas');
    }
  };

  const fetchLinks = async () => {
    try {
      const response = await axios.get(`${API}/links`, { headers: getAuthHeaders() });
      setLinks(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar vínculos');
    }
  };

  const fetchReadings = async () => {
    try {
      const response = await axios.get(`${API}/readings`, { headers: getAuthHeaders() });
      setReadings(response.data);
    } catch (error) {
      console.error('Erro ao carregar leituras');
    }
  };

  const fetchOperators = async () => {
    try {
      const response = await axios.get(`${API}/operators`, { headers: getAuthHeaders() });
      setOperators(response.data);
    } catch (error) {
      console.error('Erro ao carregar operadores');
    }
  };

  const getClientMachines = (clientId) => {
    return machines.filter(m => m.client_id === clientId);
  };

  const hasReadingToday = (machineId) => {
    const today = new Date().toISOString().split('T')[0];
    return readings.some(r => {
      const readingDate = new Date(r.reading_date).toISOString().split('T')[0];
      return r.machine_id === machineId && readingDate === today;
    });
  };

  const getOperatorForClient = (clientId) => {
    const link = links.find(l => l.client_id === clientId);
    return link?.operator_id || null;
  };

  const toggleClient = (clientId) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  const startReading = async (client, machine) => {
    const clientMachinesList = getClientMachines(client.id);
    const startIndex = clientMachinesList.findIndex(m => m.id === machine.id);
    
    setCurrentClient(client);
    setClientMachines(clientMachinesList);
    setCurrentMachineIndex(startIndex);
    setCompletedReadings([]);
    
    // Sempre começar com campos zerados - usuário digita tudo
    setReadingForm({
      previous_in: '',
      previous_out: '',
      current_in: '',
      current_out: '',
    });
    
    setReadingModalOpen(true);
  };

  const getLastReading = async (machineId) => {
    try {
      const response = await axios.get(`${API}/readings`, {
        headers: getAuthHeaders(),
      });
      
      // Filtrar leituras desta máquina e pegar a mais recente
      const machineReadings = response.data.filter(r => r.machine_id === machineId);
      if (machineReadings.length === 0) return null;
      
      // Ordenar por data e pegar a mais recente
      machineReadings.sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date));
      return machineReadings[0];
    } catch (error) {
      console.error('Erro ao buscar última leitura');
      return null;
    }
  };

  const calculateGross = () => {
    const prevIn = parseFloat(readingForm.previous_in) || 0;
    const prevOut = parseFloat(readingForm.previous_out) || 0;
    const currIn = parseFloat(readingForm.current_in) || 0;
    const currOut = parseFloat(readingForm.current_out) || 0;
    
    const rawValue = (currIn - prevIn) - (currOut - prevOut);
    
    // Aplicar multiplicador da máquina
    const multiplier = currentMachine?.multiplier || 1;
    return rawValue * multiplier;
  };

  const calculateCommissions = () => {
    const gross = calculateGross();
    
    // Comissão do cliente
    const clientCommissionValue = (gross * (currentClient?.commission_value || 0)) / 100;
    
    // Comissão do operador (se houver vínculo)
    let operatorCommissionValue = 0;
    let hasOperator = false;
    
    if (currentClient?.id) {
      const link = links.find(l => l.client_id === currentClient.id);
      if (link && link.operator_id) {
        const operator = operators.find(o => o.id === link.operator_id);
        if (operator) {
          operatorCommissionValue = (gross * operator.commission_value) / 100;
          hasOperator = true;
        }
      }
    }
    
    const netValue = gross - clientCommissionValue - operatorCommissionValue;
    
    return {
      gross,
      clientCommission: clientCommissionValue,
      operatorCommission: operatorCommissionValue,
      netValue,
      hasOperator
    };
  };

  const saveAndNext = async () => {
    try {
      const currentMachine = clientMachines[currentMachineIndex];
      const gross = calculateGross();
      
      const readingData = {
        machine_id: currentMachine.id,
        previous_in: parseFloat(readingForm.previous_in),
        previous_out: parseFloat(readingForm.previous_out),
        current_in: parseFloat(readingForm.current_in),
        current_out: parseFloat(readingForm.current_out),
        reading_date: new Date().toISOString()
      };

      const response = await axios.post(`${API}/readings`, readingData, {
        headers: getAuthHeaders(),
      });

      // Adicionar aos completados
      setCompletedReadings([...completedReadings, {
        ...response.data,
        machine: currentMachine,
        gross: gross
      }]);

      toast.success('Leitura salva!');

      // Verificar se é a última máquina
      if (currentMachineIndex < clientMachines.length - 1) {
        const nextIndex = currentMachineIndex + 1;
        
        // Resetar campos para próxima máquina - sempre zerados
        setReadingForm({
          previous_in: '',
          previous_out: '',
          current_in: '',
          current_out: '',
        });
        
        setCurrentMachineIndex(nextIndex);
      } else {
        // Finalizar e ir para comprovante
        setReadingModalOpen(false);
        generateReceipt();
      }
    } catch (error) {
      toast.error('Erro ao salvar leitura');
    }
  };

  const generateReceipt = () => {
    // Redirecionar para página de comprovante com os dados
    const receiptData = {
      client: currentClient,
      readings: completedReadings,
      operator: getOperatorForClient(currentClient.id),
      date: new Date().toISOString()
    };
    
    // Armazenar temporariamente no sessionStorage
    sessionStorage.setItem('receipt', JSON.stringify(receiptData));
    navigate('/receipt');
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLastMachine = currentMachineIndex === clientMachines.length - 1;
  const currentMachine = clientMachines[currentMachineIndex];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Clientes e Leituras</h1>
          <p className="page-subtitle">Selecione uma máquina para iniciar uma leitura</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <Input
          type="text"
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-800 border-yellow-500 text-white"
        />
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.map((client) => {
          const clientMachinesList = getClientMachines(client.id);
          const isExpanded = expandedClient === client.id;

          return (
            <Card
              key={client.id}
              className="bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-yellow-500 shadow-2xl"
            >
              <CardContent className="p-6">
                {/* Client Header */}
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleClient(client.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-yellow-400/30 shadow-lg">
                      <Users size={32} className="text-yellow-100" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-2xl">{client.name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 text-yellow-200">
                          <DollarSign size={16} />
                          <span className="text-sm">Comissão: {client.commission_value}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-200">
                          <Monitor size={16} />
                          <span className="text-sm">{clientMachinesList.length} máquinas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-yellow-300 hover:text-yellow-100"
                  >
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </Button>
                </div>

                {/* Machines Grid (Expanded) */}
                {isExpanded && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {clientMachinesList.map((machine) => {
                      const hasReading = hasReadingToday(machine.id);
                      
                      return (
                        <Card
                          key={machine.id}
                          className={`${
                            hasReading 
                              ? 'bg-green-600 border-green-400' 
                              : 'bg-slate-700 border-slate-500'
                          } border-2 hover:scale-105 transition-all`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Monitor size={20} className="text-yellow-300" />
                                <h4 className="font-bold text-white">{machine.code}</h4>
                              </div>
                              {hasReading && (
                                <CheckCircle size={20} className="text-green-200" />
                              )}
                            </div>
                            <p className="text-sm text-white mb-2">{machine.name}</p>
                            <p className="text-xs text-yellow-200 mb-3">
                              Multiplicador: {machine.multiplier}
                            </p>
                            <Button
                              size="sm"
                              onClick={() => startReading(client, machine)}
                              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
                            >
                              <FileText size={16} className="mr-2" />
                              Leitura Manual
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reading Modal */}
      <Dialog open={readingModalOpen} onOpenChange={setReadingModalOpen}>
        <DialogContent className="bg-slate-800 border-2 border-yellow-500 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-xl">
              Leitura - {currentMachine?.code} ({currentMachineIndex + 1}/{clientMachines.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Machine Info */}
            <div className="p-4 rounded-lg bg-indigo-600/50 border border-yellow-400/30">
              <h4 className="font-bold text-white mb-2">{currentMachine?.name}</h4>
              <div className="flex gap-4 text-sm text-yellow-200">
                <span>Cliente: {currentClient?.name}</span>
                <span>•</span>
                <span>Multiplicador: {currentMachine?.multiplier}</span>
              </div>
            </div>

            {/* Reading Form */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-200">Entrada Anterior</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={readingForm.previous_in}
                  onChange={(e) => setReadingForm({...readingForm, previous_in: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-slate-200">Saída Anterior</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={readingForm.previous_out}
                  onChange={(e) => setReadingForm({...readingForm, previous_out: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-slate-200">Entrada Atual</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={readingForm.current_in}
                  onChange={(e) => setReadingForm({...readingForm, current_in: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-slate-200">Saída Atual</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={readingForm.current_out}
                  onChange={(e) => setReadingForm({...readingForm, current_out: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            {/* Gross Value Preview */}
            <div className="p-4 rounded-lg bg-yellow-500/20 border border-yellow-400">
              <div className="flex justify-between items-center">
                <span className="text-yellow-200 font-medium">Valor Bruto (com multiplicador {currentMachine?.multiplier}):</span>
                <span className="text-2xl font-bold text-white">
                  R$ {calculateCommissions().gross.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Commissions & Net Value Preview */}
            <div className="space-y-2 p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <h4 className="text-sm font-bold text-white mb-2">Cálculos em Tempo Real:</h4>
              
              <div className="flex justify-between text-sm">
                <span className="text-blue-300">Comissão Cliente ({currentClient?.commission_value}%):</span>
                <span className="text-blue-400 font-bold">R$ {calculateCommissions().clientCommission.toFixed(2)}</span>
              </div>
              
              {getOperatorForClient(currentClient?.id) && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-300">Comissão Operador:</span>
                  <span className="text-green-400 font-bold">R$ {calculateCommissions().operatorCommission.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm pt-2 border-t border-slate-600">
                <span className="text-yellow-200 font-bold">Valor Líquido:</span>
                <span className="text-yellow-400 font-bold text-lg">R$ {calculateCommissions().netValue.toFixed(2)}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="flex gap-2">
              {clientMachines.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded ${
                    idx < currentMachineIndex 
                      ? 'bg-green-500' 
                      : idx === currentMachineIndex 
                      ? 'bg-yellow-400' 
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Action Button */}
            <Button
              onClick={saveAndNext}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-6"
              disabled={!readingForm.previous_in || !readingForm.previous_out || !readingForm.current_in || !readingForm.current_out}
            >
              {isLastMachine ? (
                <>
                  <CheckCircle size={20} className="mr-2" />
                  Salvar e Finalizar
                </>
              ) : (
                <>
                  <ArrowRight size={20} className="mr-2" />
                  Salvar e Próxima
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsWithReadings;
