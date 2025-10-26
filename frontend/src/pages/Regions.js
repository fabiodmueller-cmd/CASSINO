import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Regions = () => {
  const [regions, setRegions] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchRegions();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRegion) {
        await axios.put(`${API}/regions/${editingRegion.id}`, formData, {
          headers: getAuthHeaders(),
        });
        toast.success('Região atualizada!');
      } else {
        await axios.post(`${API}/regions`, formData, {
          headers: getAuthHeaders(),
        });
        toast.success('Região criada!');
      }

      fetchRegions();
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar região');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta região?')) return;

    try {
      await axios.delete(`${API}/regions/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Região excluída!');
      fetchRegions();
    } catch (error) {
      toast.error('Erro ao excluir região');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setEditingRegion(null);
  };

  const openEdit = (region) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      description: region.description || '',
    });
    setOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-title">Regiões</h1>
          <p className="page-subtitle">Gerencie as regiões do sistema</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              data-testid="add-region-button"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Plus className="mr-2" size={20} />
              Nova Região
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{editingRegion ? 'Editar Região' : 'Nova Região'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  data-testid="region-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  data-testid="region-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                data-testid="save-region-button"
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
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((region) => (
                <tr key={region.id} data-testid={`region-row-${region.id}`}>
                  <td className="font-medium">{region.name}</td>
                  <td>{region.description || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(region)}
                        data-testid={`edit-region-${region.id}`}
                        className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(region.id)}
                        data-testid={`delete-region-${region.id}`}
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
          {regions.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Nenhuma região cadastrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Regions;
