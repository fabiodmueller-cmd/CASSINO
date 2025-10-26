import { useState } from 'react';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Download, Upload, Database, AlertCircle } from 'lucide-react';

const Settings = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`${API}/backup/export`, {
        headers: getAuthHeaders(),
      });
      
      // Criar arquivo JSON para download
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-slotmanager-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar backup');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);

      const response = await axios.post(`${API}/backup/import`, backupData, {
        headers: getAuthHeaders(),
      });

      const { imported, errors } = response.data;
      
      const totalImported = Object.values(imported).reduce((a, b) => a + b, 0);
      
      if (totalImported > 0) {
        toast.success(`${totalImported} registros importados com sucesso!`);
      }
      
      if (errors.length > 0) {
        toast.error(`${errors.length} erros encontrados na importação`);
        console.error('Erros de importação:', errors);
      }
      
      // Recarregar a página após importação bem-sucedida
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      toast.error('Erro ao importar backup. Verifique o formato do arquivo.');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie backups e configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exportar Backup */}
        <Card className="glass-card border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Download size={24} className="text-green-400" />
              Exportar Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300 text-sm">
              Exporte todos os dados do sistema (clientes, operadores, regiões, máquinas e leituras) 
              em formato JSON para fazer backup ou migração.
            </p>
            
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-200 mb-2">O que será exportado:</h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>✓ Clientes e suas comissões</li>
                <li>✓ Operadores e suas comissões</li>
                <li>✓ Regiões cadastradas</li>
                <li>✓ Máquinas e configurações</li>
                <li>✓ Histórico de leituras</li>
              </ul>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting}
              data-testid="export-backup-button"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {exporting ? (
                'Exportando...'
              ) : (
                <>
                  <Download className="mr-2" size={20} />
                  Exportar Backup (JSON)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Importar Backup */}
        <Card className="glass-card border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Upload size={24} className="text-blue-400" />
              Importar Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300 text-sm">
              Importe dados de um backup JSON anteriormente exportado. 
              Os dados serão adicionados ao banco de dados atual.
            </p>

            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-300 mb-1">Atenção!</h4>
                  <p className="text-xs text-yellow-200">
                    Os dados importados serão ADICIONADOS ao banco atual. 
                    Se houver IDs duplicados, pode causar conflitos.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-200 mb-2">Formato do JSON:</h4>
              <pre className="text-xs text-slate-400 overflow-x-auto">
{`{
  "clients": [...],
  "operators": [...],
  "regions": [...],
  "machines": [...],
  "readings": [...]
}`}
              </pre>
            </div>

            <label htmlFor="backup-upload">
              <Button
                as="span"
                disabled={importing}
                data-testid="import-backup-button"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {importing ? (
                  'Importando...'
                ) : (
                  <>
                    <Upload className="mr-2" size={20} />
                    Selecionar Arquivo JSON
                  </>
                )}
              </Button>
              <input
                id="backup-upload"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card className="glass-card border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database size={24} className="text-purple-400" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <div className="text-slate-400 text-sm">Versão</div>
                <div className="text-xl font-bold text-white mt-1">1.0.0</div>
              </div>
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <div className="text-slate-400 text-sm">Banco de Dados</div>
                <div className="text-xl font-bold text-white mt-1">MongoDB</div>
              </div>
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <div className="text-slate-400 text-sm">Sistema</div>
                <div className="text-xl font-bold text-white mt-1">SlotManager</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
