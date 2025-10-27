import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Monitor, Power, PowerOff, Users, MapPin, UserCog, Zap } from 'lucide-react';

const MachinesCards = () => {
  const [machines, setMachines] = useState([]);
  const [clients, setClients] = useState([]);
  const [operators, setOperators] = useState([]);
  const [regions, setRegions] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    multiplier: '0.01',
    client_id: '',
    region_id: '',
    operator_id: '',
  });

  useEffect(() => {
    fetchMachines();
    fetchClients();
    fetchOperators();
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
      console.error('Erro ao carregar clientes');
    }
  };

  const fetchOperators = async () => {
    try {
      const response = await axios.get(`${API}/operators`, {
        headers: getAuthHeaders(),
      });
      setOperators(response.data);
    } catch (error) {
      console.error('Erro ao carregar operadores');
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await axios.get(`${API}/regions`, {
        headers: getAuthHeaders(),
      });
      setRegions(response.data);
    } catch (error) {
      console.error('Erro ao carregar regiões');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        multiplier: parseFloat(formData.multiplier),
        operator_id: formData.operator_id || null,
      };

      if (editingMachine) {
        await axios.put(`${API}/machines/${editingMachine.id}`, data, {
          headers: getAuthHeaders(),
        });
        toast.success('Máquina atualizada!');
      } else {
        await axios.post(`${API}/machines`, data, {
          headers: getAuthHeaders(),
        });
        toast.success('Máquina criada!');
      }

      fetchMachines();
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar máquina');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta máquina?')) return;

    try {
      await axios.delete(`${API}/machines/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Máquina excluída!');
      fetchMachines();
    } catch (error) {
      toast.error('Erro ao excluir máquina');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      multiplier: '0.01',
      client_id: '',
      region_id: '',
      operator_id: '',
    });
    setEditingMachine(null);
  };

  const openEdit = (machine) => {
    setEditingMachine(machine);
    setFormData({
      code: machine.code,
      name: machine.name,
      multiplier: machine.multiplier.toString(),
      client_id: machine.client_id,
      region_id: machine.region_id,
      operator_id: machine.operator_id || '',
    });
    setOpen(true);
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || '-';
  };

  const getRegionName = (regionId) => {
    const region = regions.find((r) => r.id === regionId);
    return region?.name || '-';
  };

  const getOperatorName = (operatorId) => {
    if (!operatorId) return 'Nenhum';
    const operator = operators.find((o) => o.id === operatorId);
    return operator?.name || '-';
  };

  const multiplierOptions = [
    { value: '0.01', label: '0.01' },
    { value: '0.10', label: '0.10' },
    { value: '0.25', label: '0.25' },
    { value: '0.50', label: '0.50' },
    { value: '1.00', label: '1.00' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Máquinas</h1>
          <p className="page-subtitle">Gerencie todas as máquinas caça-níqueis</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          data-testid="add-machine-button"
          className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 border-2 border-yellow-400 shadow-lg shadow-yellow-500/30"
        >
          <Plus className="mr-2" size={20} />
          Nova Máquina
        </Button>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-slate-800 border-2 border-yellow-500 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">{editingMachine ? 'Editar Máquina' : 'Nova Máquina'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  data-testid="machine-code-input"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  data-testid="machine-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label htmlFor="multiplier">Multiplicador</Label>
                <Select
                  value={formData.multiplier}
                  onValueChange={(value) => setFormData({ ...formData, multiplier: value })}
                >
                  <SelectTrigger data-testid="multiplier-select" className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {multiplierOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client_id">Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger data-testid="client-select" className="bg-slate-700 border-slate-600">
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

              <div>
                <Label htmlFor="region_id">Região</Label>
                <Select
                  value={formData.region_id}
                  onValueChange={(value) => setFormData({ ...formData, region_id: value })}
                >
                  <SelectTrigger data-testid="region-select" className="bg-slate-700 border-slate-600">
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

              <div>
                <Label htmlFor="operator_id">Operador (opcional)</Label>
                <Select
                  value={formData.operator_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, operator_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger data-testid="operator-select" className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Selecione um operador" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="none">Nenhum</SelectItem>
                    {operators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.id}>
                        {operator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                data-testid="save-machine-button"
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
              >
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.map((machine) => (
          <Card
            key={machine.id}
            data-testid={`machine-card-${machine.id}`}
            className="bg-gradient-to-br from-yellow-600 to-amber-700 border-2 border-yellow-400 hover:scale-105 transition-all shadow-2xl shadow-yellow-500/30 hover:shadow-yellow-400/50"
          >
            <CardContent className="p-6">
              {/* Header with Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-yellow-300/30 shadow-lg">
                    <Monitor size={28} className="text-yellow-100" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">{machine.code}</h3>
                    <p className="text-sm text-yellow-100">{machine.name}</p>
                  </div>
                </div>
                {machine.active ? (
                  <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    <Power size={14} />
                    ATIVO
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    <PowerOff size={14} />
                    INATIVO
                  </div>
                )}
              </div>

              {/* Multiplier Badge */}
              <div className="mb-4 p-3 rounded-xl bg-white/20 border-2 border-yellow-300 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-yellow-200" />
                  <span className="text-sm text-yellow-100 font-medium">Multiplicador</span>
                </div>
                <span className="text-2xl font-bold text-white">{machine.multiplier}</span>
              </div>

              {/* Info Grid */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/60 border border-blue-400/30">
                  <Users size={16} className="text-blue-300" />
                  <span className="text-sm text-white font-medium">{getClientName(machine.client_id)}</span>
                </div>
                
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/60 border border-orange-400/30">
                  <MapPin size={16} className="text-orange-300" />
                  <span className="text-sm text-white font-medium">{getRegionName(machine.region_id)}</span>
                </div>
                
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/60 border border-green-400/30">
                  <UserCog size={16} className="text-green-300" />
                  <span className="text-sm text-white font-medium">{getOperatorName(machine.operator_id)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t-2 border-yellow-300/50">
                <Button
                  size="sm"
                  onClick={() => openEdit(machine)}
                  data-testid={`edit-machine-${machine.id}`}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400"
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDelete(machine.id)}
                  data-testid={`delete-machine-${machine.id}`}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white border-2 border-red-400"
                >
                  <Trash2 size={16} className="mr-2" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {machines.length === 0 && (
        <Card className="bg-slate-800/60 border-2 border-yellow-500">
          <CardContent className="p-12">
            <div className="text-center text-white">
              <Monitor size={48} className="mx-auto mb-4 text-yellow-400" />
              <p>Nenhuma máquina cadastrada</p>
              <p className="text-sm mt-2 text-slate-300">Clique em "Nova Máquina" para começar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MachinesCards;
