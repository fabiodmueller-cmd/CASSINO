import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, getAuthHeaders } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, Share2, ArrowLeft, Receipt as ReceiptIcon,
  Users, Monitor, DollarSign, Calendar, UserCog
} from 'lucide-react';
import { toast } from 'sonner';

const Receipt = () => {
  const [receiptData, setReceiptData] = useState(null);
  const [operator, setOperator] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem('receipt');
    if (stored) {
      const data = JSON.parse(stored);
      setReceiptData(data);
      
      // Buscar informações do operador se houver
      if (data.operator) {
        fetchOperator(data.operator);
      }
    } else {
      navigate('/clients');
    }
  }, [navigate]);

  const fetchOperator = async (operatorId) => {
    try {
      const response = await axios.get(`${API}/operators/${operatorId}`, {
        headers: getAuthHeaders(),
      });
      setOperator(response.data);
    } catch (error) {
      console.error('Erro ao carregar operador');
    }
  };

  if (!receiptData) {
    return <div className="text-white">Carregando...</div>;
  }

  const totalGross = receiptData.readings.reduce((sum, r) => sum + r.gross, 0);
  const clientCommission = (totalGross * receiptData.client.commission_value) / 100;
  const operatorCommission = operator 
    ? (totalGross * operator.commission_value) / 100 
    : 0;
  const netValue = totalGross - clientCommission - operatorCommission;

  const shareWhatsApp = () => {
    const message = `
*COMPROVANTE DE LEITURA*

📅 Data: ${new Date(receiptData.date).toLocaleDateString('pt-BR')}
👤 Cliente: ${receiptData.client.name}

*MÁQUINAS LIDAS:*
${receiptData.readings.map((r, idx) => 
  `${idx + 1}. ${r.machine.code} - ${r.machine.name}
   Bruto: R$ ${r.gross.toFixed(2)}`
).join('\n')}

*RESUMO FINANCEIRO:*
💰 Valor Bruto Total: R$ ${totalGross.toFixed(2)}
📊 Comissão Cliente (${receiptData.client.commission_value}%): R$ ${clientCommission.toFixed(2)}
${operator ? `👨‍💼 Comissão Operador (${operator.commission_value}%): R$ ${operatorCommission.toFixed(2)}` : ''}
✅ Valor Líquido: R$ ${netValue.toFixed(2)}

Total de máquinas: ${receiptData.readings.length}
    `.trim();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/clients')}
          className="text-yellow-400 hover:text-yellow-300"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar
        </Button>
        <div className="flex items-center gap-3">
          <CheckCircle size={32} className="text-green-400" />
          <h1 className="text-3xl font-bold text-white">Leitura Concluída!</h1>
        </div>
      </div>

      {/* Receipt Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-yellow-500 shadow-2xl">
        <CardContent className="p-8">
          {/* Header Info */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-yellow-500/30">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-yellow-400/20">
                <ReceiptIcon size={40} className="text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Comprovante de Leitura</h2>
                <p className="text-slate-400">
                  {new Date(receiptData.date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-6 p-4 rounded-lg bg-blue-600/20 border border-blue-400/30">
            <div className="flex items-center gap-3 mb-2">
              <Users size={24} className="text-blue-300" />
              <h3 className="text-xl font-bold text-white">Cliente</h3>
            </div>
            <p className="text-2xl text-yellow-400 font-bold">{receiptData.client.name}</p>
            <p className="text-sm text-slate-300">Comissão: {receiptData.client.commission_value}%</p>
          </div>

          {/* Operator Info (if exists) */}
          {operator && (
            <div className="mb-6 p-4 rounded-lg bg-green-600/20 border border-green-400/30">
              <div className="flex items-center gap-3 mb-2">
                <UserCog size={24} className="text-green-300" />
                <h3 className="text-xl font-bold text-white">Operador Responsável</h3>
              </div>
              <p className="text-xl text-green-300 font-bold">{operator.name}</p>
              <p className="text-sm text-slate-300">Comissão: {operator.commission_value}%</p>
            </div>
          )}

          {/* Readings List */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Monitor size={20} className="text-yellow-400" />
              Máquinas Lidas ({receiptData.readings.length})
            </h3>
            <div className="space-y-2">
              {receiptData.readings.map((reading, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-slate-700/50 border border-slate-600 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-white">{reading.machine.code} - {reading.machine.name}</p>
                    <p className="text-sm text-slate-400">
                      Entrada: {reading.current_in} | Saída: {reading.current_out}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Valor Bruto</p>
                    <p className="text-xl font-bold text-green-400">R$ {reading.gross.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-6 rounded-lg bg-yellow-500/10 border-2 border-yellow-400">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Resumo Financeiro</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-yellow-500/30">
                <span className="text-slate-300">Valor Bruto Total:</span>
                <span className="text-2xl font-bold text-white">R$ {totalGross.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Comissão Cliente ({receiptData.client.commission_value}%):</span>
                <span className="text-lg text-blue-400 font-bold">- R$ {clientCommission.toFixed(2)}</span>
              </div>
              {operator && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Comissão Operador ({operator.commission_value}%):</span>
                  <span className="text-lg text-green-400 font-bold">- R$ {operatorCommission.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t-2 border-yellow-400">
                <span className="text-xl font-bold text-yellow-300">Valor Líquido:</span>
                <span className="text-3xl font-bold text-green-400">R$ {netValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={shareWhatsApp}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-6"
            >
              <Share2 size={20} className="mr-2" />
              Compartilhar no WhatsApp
            </Button>
            <Button
              onClick={() => navigate('/clients')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-lg py-6"
            >
              <Users size={20} className="mr-2" />
              Voltar aos Clientes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Receipt;
