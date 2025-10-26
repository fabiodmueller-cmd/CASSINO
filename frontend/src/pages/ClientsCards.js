import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, DollarSign, Phone, Mail, Percent } from 'lucide-react';

const ClientsCards = () => {
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    commission_type: 'percentage',
    commission_value: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        commission_value: parseFloat(formData.commission_value),
      };

      if (editingClient) {
        await axios.put(`${API}/clients/${editingClient.id}`, data, {
          headers: getAuthHeaders(),
        });
        toast.success('Cliente atualizado!');
      } else {
        await axios.post(`${API}/clients`, data, {
          headers: getAuthHeaders(),
        });
        toast.success('Cliente criado!');
      }

      fetchClients();
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      await axios.delete(`${API}/clients/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Cliente excluído!');
      fetchClients();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      commission_type: 'percentage',
      commission_value: '',
      phone: '',
      email: '',
    });
    setEditingClient(null);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      commission_type: client.commission_type,
      commission_value: client.commission_value.toString(),
      phone: client.phone || '',
      email: client.email || '',
    });
    setOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gerencie seus clientes e comissões</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              data-testid="add-client-button"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Plus className="mr-2" size={20} />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  data-testid="client-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label htmlFor="commission_type">Tipo de Comissão</Label>
                <Select
                  value={formData.commission_type}
                  onValueChange={(value) => setFormData({ ...formData, commission_type: value })}
                >
                  <SelectTrigger data-testid="commission-type-select" className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="commission_value">
                  Valor da Comissão {formData.commission_type === 'percentage' ? '(%)' : '(R$)'}
                </Label>
                <Input
                  id="commission_value"
                  data-testid="commission-value-input"
                  type="number"
                  step="0.01"
                  value={formData.commission_value}
                  onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  data-testid="phone-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  data-testid="email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <Button
                type="submit"
                data-testid="save-client-button"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Card
            key={client.id}
            data-testid={`client-card-${client.id}`}
            className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all hover:scale-105"
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Users size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{client.name}</h3>
                    <p className="text-xs text-slate-400">Cliente #{client.id.slice(0, 8)}</p>
                  </div>
                </div>
              </div>

              {/* Comissão */}
              <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {client.commission_type === 'percentage' ? (
                      <Percent size={18} className="text-orange-400" />
                    ) : (
                      <DollarSign size={18} className="text-orange-400" />
                    )}
                    <span className="text-sm text-slate-300">Comissão</span>
                  </div>
                  <span className="text-xl font-bold text-orange-400">
                    {client.commission_type === 'percentage'
                      ? `${client.commission_value}%`
                      : `R$ ${client.commission_value.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Contatos */}
              <div className="space-y-2 mb-4">
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-blue-400" />
                    <span className="text-slate-300">{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-purple-400" />
                    <span className="text-slate-300">{client.email}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <Button
                  size="sm"
                  onClick={() => openEdit(client)}
                  data-testid={`edit-client-${client.id}`}
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDelete(client.id)}
                  data-testid={`delete-client-${client.id}`}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                >
                  <Trash2 size={16} className="mr-2" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-12">
            <div className="text-center text-slate-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente cadastrado</p>
              <p className="text-sm mt-2">Clique em "Novo Cliente" para começar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientsCards;
