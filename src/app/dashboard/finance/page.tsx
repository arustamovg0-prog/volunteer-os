'use client';

import { useState, useEffect } from 'react';
import { 
  Calculator, 
  Search, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { getPrivilegedHeaders } from '@/lib/client-security';

interface DidoxInvoice {
  id: string;
  supplier_name: string;
  item_name: string;
  price: number;
  qty: number;
  avg_historic_price: number;
  flagged_reason?: string | null;
  created_at: string;
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState<DidoxInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('manager');
  
  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [avgHistoricPrice, setAvgHistoricPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole') || 'manager';
    setRole(savedRole);
    if (savedRole === 'admin') {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    if (!supplierName || !itemName || !price || !qty || !avgHistoricPrice) {
      setFormMessage({ type: 'error', text: 'Пожалуйста, заполните все поля.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({
          supplier_name: supplierName,
          item_name: itemName,
          price: Number(price),
          qty: Number(qty),
          avg_historic_price: Number(avgHistoricPrice)
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        // Clear form
        setSupplierName('');
        setItemName('');
        setPrice('');
        setQty('');
        setAvgHistoricPrice('');
        await fetchInvoices();
        setFormMessage({ type: 'success', text: 'Инвойс импортирован и прошел автоматическую проверку.' });
      } else {
        const payload = await res.json().catch(() => ({}));
        setFormMessage({ type: 'error', text: payload.error || 'Ошибка при сохранении инвойса.' });
      }
    } catch (err) {
      console.error(err);
      setFormMessage({ type: 'error', text: 'Ошибка соединения при сохранении инвойса.' });
    } finally {
      setSubmitting(false);
    }
  };

  // If role is not admin, show Restricted View
  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h1 className="text-md font-bold text-slate-900 uppercase tracking-wide">Доступ ограничен</h1>
        
        <p className="text-xs text-slate-500 leading-relaxed">
          Раздел «Дидокс Финансы» содержит конфиденциальные бухгалтерские данные, аудит цен и отчетность поставщиков. 
          Доступ разрешен только для <strong>Руководителя Ассоциации (Ширин)</strong>.
        </p>

        <p className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          Смените роль в правом верхнем симуляторе или перейдите в другие разделы управления.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-slate-800" />
            Интеграция Didox (Финансовый Контроль)
          </h1>
          <p className="text-xs text-slate-500">Автоматический аудит стоимости закупок по сравнению со средними рыночными показателями</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Импорт инвойса
        </button>
      </div>

      {formMessage && (
        <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
          formMessage.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {formMessage.text}
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Всего счетов на аудите</p>
          <p className="text-2xl font-bold text-slate-800">{invoices.length}</p>
          <p className="text-[10px] text-slate-400">Синхронизировано с порталом didox.uz</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Флаги завышения цен</p>
          <p className="text-2xl font-bold text-red-600">
            {invoices.filter(i => i.flagged_reason).length}
          </p>
          <p className="text-[10px] text-red-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Превышение цены &gt; 1.5x от исторической
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Успешно одобрено</p>
          <p className="text-2xl font-bold text-emerald-600">
            {invoices.filter(i => !i.flagged_reason).length}
          </p>
          <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            Оптимальный ценовой диапазон
          </p>
        </div>
      </div>

      {/* Invoice Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Аудит счетов Didox...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Поставщик</th>
                  <th className="py-3 px-5">Товар / Услуга</th>
                  <th className="py-3 px-5">Кол-во</th>
                  <th className="py-3 px-5">Цена за ед. (сум)</th>
                  <th className="py-3 px-5">Ист. средняя</th>
                  <th className="py-3 px-5">Статус аудита</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map((inv) => {
                  const isFlagged = !!inv.flagged_reason;
                  
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-800">
                        {inv.supplier_name}
                      </td>
                      <td className="py-4 px-5 text-slate-600 font-semibold">
                        {inv.item_name}
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-mono">
                        {inv.qty}
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-700">
                        {inv.price.toLocaleString()} сум
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-400">
                        {inv.avg_historic_price.toLocaleString()} сум
                      </td>
                      <td className="py-4 px-5">
                        {isFlagged ? (
                          <div className="flex flex-col space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-100 font-bold text-[9px] uppercase tracking-wider w-fit">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Завышена цена
                            </span>
                            <span className="text-[10px] text-red-500 max-w-xs leading-relaxed">
                              {inv.flagged_reason}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] uppercase tracking-wider w-fit">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            Одобрен
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-slate-800" />
                Импорт электронного инвойса
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-950 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Поставщик *</label>
                <input
                  type="text"
                  required
                  placeholder="Например, Olim Metal LLC, Paper World"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Наименование товара *</label>
                <input
                  type="text"
                  required
                  placeholder="Лопаты металлические, Бумага A4 SvetoCopy"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Кол-во *</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Цена за ед. (сум) *</label>
                  <input
                    type="number"
                    required
                    placeholder="150000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Историческая средняя цена (сум) *</label>
                <input
                  type="number"
                  required
                  placeholder="50000"
                  value={avgHistoricPrice}
                  onChange={(e) => setAvgHistoricPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                />
                <p className="text-[9px] text-slate-400">Система автоматически сравнит импортируемую цену со средней для выявления завышения.</p>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Импортировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
