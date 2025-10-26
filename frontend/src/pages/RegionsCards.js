import { useState, useEffect } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MapPin, Map, Globe } from 'lucide-react';

const RegionsCards = () => {
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

  const regionColors = [
    'from-orange-600 to-red-700',
    'from-cyan-600 to-blue-700',
    'from-purple-600 to-pink-700',
    'from-green-600 to-emerald-700',
    'from-yellow-600 to-orange-700',
    'from-indigo-600 to-purple-700',
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Regiões</h1>
          <p className="page-subtitle">Organize suas operações por região</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              data-testid="add-region-button"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-2 border-yellow-500 shadow-lg shadow-orange-500/30"
            >
              <Plus className="mr-2" size={20} />
              Nova Região
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-2 border-yellow-500 text-white">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">{editingRegion ? 'Editar Região' : 'Nova Região'}</DialogTitle>
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
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.map((region, index) => (
          <Card
            key={region.id}
            data-testid={`region-card-${region.id}`}
            className={`bg-gradient-to-br ${regionColors[index % regionColors.length]} border-2 border-yellow-500 hover:scale-105 transition-all shadow-2xl shadow-orange-500/30 hover:shadow-yellow-500/40`}
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-4 rounded-xl bg-yellow-400/30 shadow-lg">
                    <MapPin size={32} className="text-yellow-200" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-2xl">{region.name}</h3>
                    <p className="text-xs text-white/80 mt-1">Região Operacional</p>
                  </div>
                </div>
                <Globe className="text-yellow-400" size={24} />
              </div>

              {/* Description */}
              {region.description && (
                <div className="mb-4 p-4 rounded-xl bg-white/10 border-2 border-yellow-400/50 backdrop-blur-sm">
                  <div className="flex items-start gap-2">
                    <Map size={18} className="text-yellow-300 mt-0.5" />
                    <p className="text-sm text-white/90">{region.description}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t-2 border-yellow-400/30">
                <Button
                  size="sm"
                  onClick={() => openEdit(region)}
                  data-testid={`edit-region-${region.id}`}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400"
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDelete(region.id)}
                  data-testid={`delete-region-${region.id}`}
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

      {regions.length === 0 && (
        <Card className="bg-slate-800/60 border-2 border-yellow-500">
          <CardContent className="p-12">
            <div className="text-center text-white">
              <MapPin size={48} className="mx-auto mb-4 text-orange-400" />
              <p>Nenhuma região cadastrada</p>
              <p className="text-sm mt-2 text-slate-300">Clique em "Nova Região" para começar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RegionsCards;