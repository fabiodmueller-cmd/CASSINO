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
import { Plus, Edit, Trash2, UserCog, DollarSign, Phone, Percent, Award } from 'lucide-react';

const OperatorsCards = () => {
  const [operators, setOperators] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    commission_type: 'percentage',
    commission_value: '',
    phone: '',
  });

  useEffect(() => {
    fetchOperators();
  }, []);

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
      const data = {
        ...formData,
        commission_value: parseFloat(formData.commission_value),
      };

      if (editingOperator) {
        await axios.put(`${API}/operators/${editingOperator.id}`, data, {
          headers: getAuthHeaders(),
        });
        toast.success('Operador atualizado!');
      } else {
        await axios.post(`${API}/operators`, data, {
          headers: getAuthHeaders(),
        });
        toast.success('Operador criado!');
      }

      fetchOperators();
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar operador');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este operador?')) return;

    try {
      await axios.delete(`${API}/operators/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Operador excluído!');
      fetchOperators();
    } catch (error) {
      toast.error('Erro ao excluir operador');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      commission_type: 'percentage',
      commission_value: '',
      phone: '',
    });
    setEditingOperator(null);
  };

  const openEdit = (operator) => {
    setEditingOperator(operator);
    setFormData({
      name: operator.name,
      commission_type: operator.commission_type,
      commission_value: operator.commission_value.toString(),
      phone: operator.phone || '',
    });
    setOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Operadores</h1>
          <p className="page-subtitle">Gerencie operadores e comissões</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              data-testid="add-operator-button"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-2 border-yellow-500 shadow-lg shadow-green-500/30"
            >
              <Plus className="mr-2" size={20} />
              Novo Operador
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-2 border-yellow-500 text-white">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">{editingOperator ? 'Editar Operador' : 'Novo Operador'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  data-testid="operator-name-input"
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

              <Button
                type="submit"
                data-testid="save-operator-button"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.map((operator) => (
          <Card
            key={operator.id}
            data-testid={`operator-card-${operator.id}`}
            className="bg-gradient-to-br from-green-600 to-emerald-700 border-2 border-yellow-500 hover:scale-105 transition-all shadow-2xl shadow-green-500/30 hover:shadow-yellow-500/40"
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-yellow-400/30 shadow-lg">
                    <UserCog size={28} className="text-yellow-200" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">{operator.name}</h3>
                    <p className="text-xs text-green-100">Operador</p>
                  </div>
                </div>
                <Award className="text-yellow-400" size={24} />
              </div>

              {/* Comissão */}
              <div className="mb-4 p-4 rounded-xl bg-white/10 border-2 border-yellow-400/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {operator.commission_type === 'percentage' ? (
                      <Percent size={20} className="text-yellow-300" />
                    ) : (
                      <DollarSign size={20} className="text-yellow-300" />
                    )}
                    <span className="text-sm text-green-100 font-medium">Comissão</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-300">
                    {operator.commission_type === 'percentage'
                      ? `${operator.commission_value}%`
                      : `R$ ${operator.commission_value.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Contato */}
              {operator.phone && (
                <div className="mb-4 flex items-center gap-2 text-sm text-green-50 bg-green-800/30 p-3 rounded-lg">
                  <Phone size={16} className="text-yellow-400" />
                  <span>{operator.phone}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t-2 border-yellow-400/30">
                <Button
                  size="sm"
                  onClick={() => openEdit(operator)}
                  data-testid={`edit-operator-${operator.id}`}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400"
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDelete(operator.id)}
                  data-testid={`delete-operator-${operator.id}`}
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

      {operators.length === 0 && (
        <Card className="bg-slate-800/60 border-2 border-yellow-500">
          <CardContent className="p-12">
            <div className="text-center text-white">
              <UserCog size={48} className="mx-auto mb-4 text-green-400" />
              <p>Nenhum operador cadastrado</p>
              <p className="text-sm mt-2 text-slate-300">Clique em "Novo Operador" para começar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OperatorsCards;