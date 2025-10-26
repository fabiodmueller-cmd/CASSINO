import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Operators = () => {
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
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-title">Operadores</h1>
          <p className="page-subtitle">Gerencie os operadores do sistema</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              data-testid="add-operator-button"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Plus className="mr-2" size={20} />
              Novo Operador
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{editingOperator ? 'Editar Operador' : 'Novo Operador'}</DialogTitle>
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
                <th>Nome</th>
                <th>Tipo Comissão</th>
                <th>Valor Comissão</th>
                <th>Telefone</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((operator) => (
                <tr key={operator.id} data-testid={`operator-row-${operator.id}`}>
                  <td className="font-medium">{operator.name}</td>
                  <td>{operator.commission_type === 'percentage' ? 'Porcentagem' : 'Fixo'}</td>
                  <td>
                    {operator.commission_type === 'percentage'
                      ? `${operator.commission_value}%`
                      : `R$ ${operator.commission_value.toFixed(2)}`}
                  </td>
                  <td>{operator.phone || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(operator)}
                        data-testid={`edit-operator-${operator.id}`}
                        className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(operator.id)}
                        data-testid={`delete-operator-${operator.id}`}
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
          {operators.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Nenhum operador cadastrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Operators;
