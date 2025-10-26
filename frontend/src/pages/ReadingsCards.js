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
import { Plus, Upload, Trash2, FileText, TrendingUp, DollarSign, Calendar, Monitor } from 'lucide-react';
import { format } from 'date-fns';

const ReadingsCards = () => {
  const [readings, setReadings] = useState([]);
  const [machines, setMachines] = useState([]);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    machine_id: '',
    previous_in: '',
    previous_out: '',
    current_in: '',
    current_out: '',
    reading_date: '',
  });

  useEffect(() => {
    fetchReadings();
    fetchMachines();
  }, []);

  const fetchReadings = async () => {
    try {
      const response = await axios.get(`${API}/readings`, {
        headers: getAuthHeaders(),
      });
      setReadings(response.data);
    } catch (error) {
      toast.error('Erro ao carregar leituras');
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await axios.get(`${API}/machines`, {
        headers: getAuthHeaders(),
      });
      setMachines(response.data);
    } catch (error) {
      console.error('Erro ao carregar máquinas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        machine_id: formData.machine_id,
        previous_in: parseFloat(formData.previous_in),
        previous_out: parseFloat(formData.previous_out),
        current_in: parseFloat(formData.current_in),
        current_out: parseFloat(formData.current_out),
        reading_date: formData.reading_date ? new Date(formData.reading_date).toISOString() : null,
      };

      await axios.post(`${API}/readings`, data, {
        headers: getAuthHeaders(),
      });
      toast.success('Leitura registrada!');

      fetchReadings();
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao registrar leitura');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/readings/import`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(`${response.data.imported} leituras importadas!`);
      if (response.data.errors.length > 0) {
        toast.error(`${response.data.errors.length} erros encontrados`);
      }
      fetchReadings();
    } catch (error) {
      toast.error('Erro ao importar arquivo');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta leitura?')) return;

    try {
      await axios.delete(`${API}/readings/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Leitura excluída!');
      fetchReadings();
    } catch (error) {
      toast.error('Erro ao excluir leitura');
    }
  };

  const resetForm = () => {
    setFormData({
      machine_id: '',
      previous_in: '',
      previous_out: '',
      current_in: '',
      current_out: '',
      reading_date: '',
    });
  };

  const getMachineName = (machineId) => {
    const machine = machines.find((m) => m.id === machineId);
    return machine ? `${machine.code} - ${machine.name}` : '-';
  };

  const downloadTemplate = () => {
    const csvContent = 'machine_id,previous_in,previous_out,current_in,current_out,reading_date\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_leituras.csv';
    a.click();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Leituras</h1>
          <p className="page-subtitle">Registre e acompanhe as leituras das máquinas</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={downloadTemplate}
            data-testid="download-template-button"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <FileText className="mr-2" size={20} />
            Template CSV
          </Button>
          <div>
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('file-upload').click()}
              data-testid="import-button"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={importing}
            >
              <Upload className="mr-2" size={20} />
              {importing ? 'Importando...' : 'Importar CSV'}
            </Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                data-testid="add-reading-button"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Plus className="mr-2" size={20} />
                Nova Leitura
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Leitura</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="machine_id">Máquina</Label>
                  <Select
                    value={formData.machine_id}
                    onValueChange={(value) => setFormData({ ...formData, machine_id: value })}
                  >
                    <SelectTrigger data-testid="machine-select" className="bg-slate-700 border-slate-600">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="previous_in">Entrada Anterior</Label>
                    <Input
                      id="previous_in"
                      data-testid="previous-in-input"
                      type="number"
                      step="0.01"
                      value={formData.previous_in}
                      onChange={(e) => setFormData({ ...formData, previous_in: e.target.value })}
                      required
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="previous_out">Saída Anterior</Label>
                    <Input
                      id="previous_out"
                      data-testid="previous-out-input"
                      type="number"
                      step="0.01"
                      value={formData.previous_out}
                      onChange={(e) => setFormData({ ...formData, previous_out: e.target.value })}
                      required
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current_in">Entrada Atual</Label>
                    <Input
                      id="current_in"
                      data-testid="current-in-input"
                      type="number"
                      step="0.01"
                      value={formData.current_in}
                      onChange={(e) => setFormData({ ...formData, current_in: e.target.value })}
                      required
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="current_out">Saída Atual</Label>
                    <Input
                      id="current_out"
                      data-testid="current-out-input"
                      type="number"
                      step="0.01"
                      value={formData.current_out}
                      onChange={(e) => setFormData({ ...formData, current_out: e.target.value })}
                      required
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reading_date">Data da Leitura (opcional)</Label>
                  <Input
                    id="reading_date"
                    data-testid="reading-date-input"
                    type="datetime-local"
                    value={formData.reading_date}
                    onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <Button
                  type="submit"
                  data-testid="save-reading-button"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Salvar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {readings.map((reading) => (
          <Card
            key={reading.id}
            data-testid={`reading-card-${reading.id}`}
            className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all hover:scale-105"
          >
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Monitor size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {getMachineName(reading.machine_id)}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                      <Calendar size={14} />
                      <span>{format(new Date(reading.reading_date), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(reading.id)}
                  data-testid={`delete-reading-${reading.id}`}
                  className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              {/* Values Grid */}
              <div className="space-y-3">
                {/* Valor Bruto */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-400" />
                    <span className="text-sm text-slate-300">Valor Bruto</span>
                  </div>
                  <span className="text-lg font-bold text-green-400">
                    R$ {reading.gross_value.toFixed(2)}
                  </span>
                </div>

                {/* Comissão Cliente */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-orange-400" />
                    <span className="text-sm text-slate-300">Com. Cliente</span>
                  </div>
                  <span className="text-lg font-bold text-orange-400">
                    R$ {reading.client_commission.toFixed(2)}
                  </span>
                </div>

                {/* Comissão Operador */}
                {reading.operator_commission > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-yellow-400" />
                      <span className="text-sm text-slate-300">Com. Operador</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-400">
                      R$ {reading.operator_commission.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Valor Líquido */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-blue-400" />
                    <span className="text-sm font-semibold text-slate-200">Valor Líquido</span>
                  </div>
                  <span className="text-xl font-bold text-blue-400">
                    R$ {reading.net_value.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer - Detalhes */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Entrada:</span>
                    <span className="text-slate-300 ml-1">
                      {reading.previous_in.toFixed(0)} → {reading.current_in.toFixed(0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Saída:</span>
                    <span className="text-slate-300 ml-1">
                      {reading.previous_out.toFixed(0)} → {reading.current_out.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {readings.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-12">
            <div className="text-center text-slate-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhuma leitura registrada ainda</p>
              <p className="text-sm mt-2">Clique em "Nova Leitura" para começar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReadingsCards;
