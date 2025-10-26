import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';

const Machines = () => {
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
    if (!operatorId) return '-';
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
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-title">Máquinas</h1>
          <p className="page-subtitle">Gerencie as máquinas caça-níqueis</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              data-testid="add-machine-button"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Plus className="mr-2" size={20} />
              Nova Máquina
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMachine ? 'Editar Máquina' : 'Nova Máquina'}</DialogTitle>
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
                  value={formData.operator_id}
                  onValueChange={(value) => setFormData({ ...formData, operator_id: value })}
                >
                  <SelectTrigger data-testid="operator-select" className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Selecione um operador" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="">Nenhum</SelectItem>
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
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Código</th>
                <th>Nome</th>
                <th>Multiplicador</th>
                <th>Cliente</th>
                <th>Região</th>
                <th>Operador</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => (
                <tr key={machine.id} data-testid={`machine-row-${machine.id}`}>
                  <td>
                    {machine.active ? (
                      <Power className="text-green-400" size={20} />
                    ) : (
                      <PowerOff className="text-red-400" size={20} />
                    )}
                  </td>
                  <td className="font-medium">{machine.code}</td>
                  <td>{machine.name}</td>
                  <td>{machine.multiplier}</td>
                  <td>{getClientName(machine.client_id)}</td>
                  <td>{getRegionName(machine.region_id)}</td>
                  <td>{getOperatorName(machine.operator_id)}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(machine)}
                        data-testid={`edit-machine-${machine.id}`}
                        className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(machine.id)}
                        data-testid={`delete-machine-${machine.id}`}
                        className="border-red-500 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {machines.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Nenhuma máquina cadastrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Machines;
