import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Link as LinkIcon, Users, UserCog, Award, TrendingUp } from 'lucide-react';

const Vinculos = () => {
  const [vinculos, setVinculos] = useState([]);
  const [clients, setClients] = useState([]);
  const [operators, setOperators] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    operator_id: '',
  });

  useEffect(() => {
    fetchVinculos();
    fetchClients();
    fetchOperators();
  }, []);

  const fetchVinculos = async () => {
    try {
      const response = await axios.get(`${API}/links`, {
        headers: getAuthHeaders(),
      });
      setVinculos(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar vínculos:', error);
      setVinculos([]);
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

  const fetchOperators = async () => {
    try {
      const response = await axios.get(`${API}/operators`, {
        headers: getAuthHeaders(),
      });
      setOperators(response.data);
    } catch (error) {
      toast.error('Erro ao carregar operadores');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/links`, formData, {
        headers: getAuthHeaders(),
      });
      
      toast.success('Vínculo criado!');
      fetchVinculos();
      setOpen(false);
      resetForm();
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao criar vínculo';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este vínculo?')) return;

    try {
      await axios.delete(`${API}/links/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Vínculo excluído!');
      fetchVinculos();
    } catch (error) {
      toast.error('Erro ao excluir vínculo');
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      operator_id: '',
    });
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'N/A';
  };

  const getOperatorName = (operatorId) => {
    const operator = operators.find(o => o.id === operatorId);
    return operator?.name || 'N/A';
  };

  const getClientCommission = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.commission_value || 0;
  };

  const getOperatorCommission = (operatorId) => {
    const operator = operators.find(o => o.id === operatorId);
    return operator?.commission_value || 0;
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Vínculos</h1>
          <p className="page-subtitle">Vincule clientes aos operadores responsáveis</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          data-testid="add-vinculo-button"
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-2 border-yellow-500 shadow-lg shadow-indigo-500/30"
        >
          <Plus className="mr-2" size={20} />
          Novo Vínculo
        </Button>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-slate-800 border-2 border-yellow-500 text-white">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">Novo Vínculo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Cliente</label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.commission_value}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Operador</label>
                <Select
                  value={formData.operator_id}
                  onValueChange={(value) => setFormData({ ...formData, operator_id: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Selecione um operador" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {operators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.id}>
                        {operator.name} ({operator.commission_value}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                data-testid="save-vinculo-button"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                disabled={!formData.client_id || !formData.operator_id}
              >
                Criar Vínculo
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vinculos.map((vinculo) => (
          <Card
            key={vinculo.id}
            data-testid={`vinculo-card-${vinculo.id}`}
            className="bg-gradient-to-br from-indigo-600 to-purple-700 border-2 border-yellow-500 hover:scale-105 transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-yellow-500/40"
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 rounded-xl bg-yellow-400/30 shadow-lg">
                  <LinkIcon size={32} className="text-yellow-200" />
                </div>
              </div>

              {/* Cliente */}
              <div className="mb-4 p-4 rounded-xl bg-white/10 border-2 border-blue-400/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className="text-blue-300" />
                  <span className="text-sm text-blue-100 font-medium">Cliente</span>
                </div>
                <p className="text-xl font-bold text-white">{getClientName(vinculo.client_id)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Award size={16} className="text-yellow-400" />
                  <span className="text-sm text-yellow-300">Comissão: {getClientCommission(vinculo.client_id)}%</span>
                </div>
              </div>

              {/* Seta de Conexão */}
              <div className="flex justify-center mb-4">
                <div className="flex flex-col items-center">
                  <TrendingUp size={24} className="text-yellow-400" />
                  <span className="text-xs text-yellow-300 mt-1">vinculado a</span>
                </div>
              </div>

              {/* Operador */}
              <div className="mb-4 p-4 rounded-xl bg-white/10 border-2 border-green-400/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <UserCog size={20} className="text-green-300" />
                  <span className="text-sm text-green-100 font-medium">Operador</span>
                </div>
                <p className="text-xl font-bold text-white">{getOperatorName(vinculo.operator_id)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Award size={16} className="text-yellow-400" />
                  <span className="text-sm text-yellow-300">Comissão: {getOperatorCommission(vinculo.operator_id)}%</span>
                </div>
              </div>

              {/* Action */}
              <Button
                size="sm"
                onClick={() => handleDelete(vinculo.id)}
                data-testid={`delete-vinculo-${vinculo.id}`}
                className="w-full bg-red-500 hover:bg-red-600 text-white border-2 border-red-400"
              >
                <Trash2 size={16} className="mr-2" />
                Excluir Vínculo
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {vinculos.length === 0 && (
        <Card className="bg-slate-800/60 border-2 border-yellow-500">
          <CardContent className="p-12">
            <div className="text-center text-white">
              <LinkIcon size={48} className="mx-auto mb-4 text-indigo-400" />
              <p>Nenhum vínculo cadastrado</p>
              <p className="text-sm mt-2 text-slate-300">
                Clique em "Novo Vínculo" para conectar clientes aos operadores
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Vinculos;
