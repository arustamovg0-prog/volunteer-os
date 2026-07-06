'use client';

import { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Share2, 
  CornerUpLeft, 
  MapPin, 
  Calendar, 
  Activity, 
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { getPrivilegedHeaders } from '@/lib/client-security';

interface ResourceItem {
  id: string;
  name: string;
  category: string;
  total_qty: number;
  allocated_qty: number;
  unit: string;
  location: string;
  created_at: string;
}

interface ResourceAllocation {
  id: string;
  resource_id: string;
  project_id: string;
  task_id?: string | null;
  qty: number;
  status: 'allocated' | 'returned';
  created_at: string;
}

interface ProjectOption {
  id: string;
  title: string;
}

interface TaskOption {
  id: string;
  project_id: string;
  title: string;
}

export default function InventoryPage() {
  const [role, setRole] = useState('manager');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [returningAllocationId, setReturningAllocationId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data State
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);

  // Selected state for allocation dropdowns
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Modals & Panels Toggles
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'allocations'>('stock');

  // Form inputs
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Инвентарь');
  const [newTotalQty, setNewTotalQty] = useState(1);
  const [newUnit, setNewUnit] = useState('шт');
  const [newLocation, setNewLocation] = useState('');

  const [allocResourceId, setAllocResourceId] = useState('');
  const [allocProjectId, setAllocProjectId] = useState('');
  const [allocTaskId, setAllocTaskId] = useState('');
  const [allocQty, setAllocQty] = useState(1);

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole');
    if (savedRole) setRole(savedRole);

    const handleRoleChange = () => {
      const updated = localStorage.getItem('currentUserRole');
      if (updated) setRole(updated);
    };

    window.addEventListener('auth-session-change', handleRoleChange);
    loadData();

    return () => window.removeEventListener('auth-session-change', handleRoleChange);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
        setAllocations(data.allocations || []);
        setProjects(data.projects || []);
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error('Failed to load inventory:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    if (role !== 'admin') {
      setActionMessage({ type: 'error', text: 'Добавлять новые ресурсы на склад может только Руководитель (Директор).' });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({
          action: 'add',
          name: newName,
          category: newCategory,
          total_qty: newTotalQty,
          unit: newUnit,
          location: newLocation
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewName('');
        setNewLocation('');
        setNewTotalQty(1);
        await loadData();
        setActionMessage({ type: 'success', text: 'Позиция добавлена на склад.' });
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Ошибка при добавлении ресурса.' });
      }
    } catch (e) {
      console.error(e);
      setActionMessage({ type: 'error', text: 'Ошибка соединения при добавлении ресурса.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAllocateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    if (role !== 'admin') {
      setActionMessage({ type: 'error', text: 'Выдавать инвентарь проектам может только Руководитель (Директор).' });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({
          action: 'allocate',
          resource_id: allocResourceId,
          project_id: allocProjectId,
          task_id: allocTaskId || null,
          qty: allocQty
        })
      });
      if (res.ok) {
        setShowAllocateModal(false);
        setAllocResourceId('');
        setAllocProjectId('');
        setAllocTaskId('');
        setAllocQty(1);
        await loadData();
        setActionMessage({ type: 'success', text: 'Выдача инвентаря оформлена.' });
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Ошибка при выдаче ресурса.' });
      }
    } catch (e) {
      console.error(e);
      setActionMessage({ type: 'error', text: 'Ошибка соединения при выдаче ресурса.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnResource = async (allocId: string) => {
    setActionMessage(null);
    if (role !== 'admin') {
      setActionMessage({ type: 'error', text: 'Оформлять возврат инвентаря на склад может только Руководитель (Директор).' });
      return;
    }
    setActionLoading(true);
    setReturningAllocationId(allocId);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({
          action: 'return',
          allocation_id: allocId
        })
      });
      if (res.ok) {
        await loadData();
        setActionMessage({ type: 'success', text: 'Инвентарь возвращен на склад.' });
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Ошибка оформления возврата.' });
      }
    } catch (e) {
      console.error(e);
      setActionMessage({ type: 'error', text: 'Ошибка соединения при оформлении возврата.' });
    } finally {
      setActionLoading(false);
      setReturningAllocationId(null);
    }
  };

  const filteredTasks = tasks.filter(t => t.project_id === allocProjectId);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24 bg-[#F9FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  // Aggregate Stats
  const totalItemsCount = resources.length;
  const activeAllocationsCount = allocations.filter(a => a.status === 'allocated').length;
  const outOfStockCount = resources.filter(r => r.total_qty - r.allocated_qty <= 0).length;

  return (
    <div className="w-full max-w-5xl space-y-6 sm:space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 leading-tight">
            <Boxes className="w-5 h-5 shrink-0 text-slate-900" />
            Склад & Учет инвентаря
          </h2>
          <p className="text-xs text-slate-500">
            Учет оборудования, выдача инвентаря на проекты и контроль возвратов на склад
          </p>
        </div>
        
        {role === 'admin' && (
          <div className="grid grid-cols-1 sm:flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Добавить позицию
            </button>
            <button
              onClick={() => setShowAllocateModal(true)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              Выдать инвентарь
            </button>
          </div>
        )}
      </div>

      {/* Role Notice */}
      {role !== 'admin' && (
        <div className="p-3 sm:p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start sm:items-center gap-2.5">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-amber-600" />
          <span>
            Режим чтения (Координатор). Выдавать оборудование и добавлять новые позиции на склад может только <strong>Руководитель (Директор)</strong>.
          </span>
        </div>
      )}

      {actionMessage && (
        <div className={`p-3 sm:p-4 rounded-lg border text-xs font-semibold ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Позиций на складе</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalItemsCount} видов</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Активных выдач</span>
            <span className="text-2xl font-extrabold text-slate-900">{activeAllocationsCount} проектов</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Закончился запас</span>
            <span className="text-2xl font-extrabold text-slate-900">{outOfStockCount} позиций</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-3 sm:gap-4 text-xs font-bold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-2.5 px-1 shrink-0 transition-all border-b-2 cursor-pointer ${activeTab === 'stock' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Ведомость остатков
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`pb-2.5 px-1 shrink-0 transition-all border-b-2 cursor-pointer ${activeTab === 'allocations' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Журнал выдач и возвратов
        </button>
      </div>

      {/* Tab 1: Stock list */}
      {activeTab === 'stock' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Наличие на складах</h3>
          </div>
          
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/25">
                <th className="px-6 py-3">Наименование</th>
                <th className="px-6 py-3">Категория</th>
                <th className="px-6 py-3">Всего</th>
                <th className="px-6 py-3">В выдаче</th>
                <th className="px-6 py-3">Свободно</th>
                <th className="px-6 py-3">Локация склада</th>
              </tr>
            </thead>
            <tbody>
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">Склад пуст. Добавьте новые позиции.</td>
                </tr>
              ) : (
                resources.map((item) => {
                  const free = item.total_qty - item.allocated_qty;
                  const isLow = free <= 0;
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{item.name}</td>
                      <td className="px-6 py-3.5 text-slate-500 font-medium">{item.category}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-700">{item.total_qty} {item.unit}</td>
                      <td className="px-6 py-3.5 font-medium text-slate-500">{item.allocated_qty} {item.unit}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isLow ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-800'}`}>
                          {free} {item.unit} {isLow && '(нет)'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.location}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Allocations logs */}
      {activeTab === 'allocations' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Активные и закрытые выдачи</h3>
          </div>
          
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/25">
                <th className="px-6 py-3">Оборудование</th>
                <th className="px-6 py-3">Проект</th>
                <th className="px-6 py-3">Кол-во</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3">Дата выдачи</th>
                {role === 'admin' && <th className="px-6 py-3 text-right">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">Выдачи отсутствуют.</td>
                </tr>
              ) : (
                allocations.map((alloc) => {
                  const resource = resources.find(r => r.id === alloc.resource_id);
                  const project = projects.find(p => p.id === alloc.project_id);
                  const isReturned = alloc.status === 'returned';

                  return (
                    <tr key={alloc.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{resource ? resource.name : 'Удаленный ресурс'}</td>
                      <td className="px-6 py-3.5 text-slate-600 font-semibold">{project ? project.title : 'Удаленный проект'}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-800">{alloc.qty} {resource?.unit}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isReturned ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'}`}>
                          {isReturned ? 'Возвращено' : 'В пользовании'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(alloc.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      {role === 'admin' && (
                        <td className="px-6 py-3.5 text-right">
                          {!isReturned && (
                            <button
                              onClick={() => handleReturnResource(alloc.id)}
                              disabled={returningAllocationId === alloc.id}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-200 text-slate-700 disabled:text-slate-400 text-[10px] font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer inline-flex"
                            >
                              {returningAllocationId === alloc.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                              ) : (
                                <CornerUpLeft className="w-3 h-3 text-slate-500" />
                              )}
                              {returningAllocationId === alloc.id ? 'Возврат...' : 'Вернуть на склад'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Add Resource Position */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-3">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl p-4 sm:p-6 w-full sm:w-[400px] max-w-full max-h-[calc(100dvh-24px)] overflow-y-auto space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Добавление позиции на склад</h3>
              <p className="text-[10px] text-slate-400">Регистрация новой позиции в ведомости</p>
            </div>
            
            <form onSubmit={handleAddResource} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Наименование</label>
                <input
                  type="text"
                  required
                  placeholder="Например, Лопаты металлические"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950 focus:border-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Категория</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                  >
                    <option value="Инвентарь">Инвентарь</option>
                    <option value="Расходники">Расходники</option>
                    <option value="Оборудование">Оборудование</option>
                    <option value="Корма">Корма</option>
                    <option value="Другое">Другое</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Ед. измерения</label>
                  <input
                    type="text"
                    required
                    placeholder="шт, кг, пар"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Количество</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newTotalQty}
                    onChange={(e) => setNewTotalQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Локация склада</label>
                  <input
                    type="text"
                    required
                    placeholder="Склад Самара"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? 'Добавление...' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Allocate/Issue Resource */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-3">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl p-4 sm:p-6 w-full sm:w-[400px] max-w-full max-h-[calc(100dvh-24px)] overflow-y-auto space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Выдача инвентаря на проект</h3>
              <p className="text-[10px] text-slate-400">Фиксация передачи инвентаря во временное пользование</p>
            </div>
            
            <form onSubmit={handleAllocateResource} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Выберите инвентарь</label>
                <select
                  required
                  value={allocResourceId}
                  onChange={(e) => setAllocResourceId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                >
                  <option value="">-- Выберите позицию --</option>
                  {resources.map(r => {
                    const free = r.total_qty - r.allocated_qty;
                    return (
                      <option key={r.id} value={r.id} disabled={free <= 0}>
                        {r.name} (осталось: {free} {r.unit})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Проект-получатель</label>
                <select
                  required
                  value={allocProjectId}
                  onChange={(e) => {
                    setAllocProjectId(e.target.value);
                    setAllocTaskId('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                >
                  <option value="">-- Выберите проект --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Задача (Опционально)</label>
                  <select
                    value={allocTaskId}
                    onChange={(e) => setAllocTaskId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                  >
                    <option value="">-- Без привязки к задаче --</option>
                    {filteredTasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Количество выдачи</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={allocQty}
                    onChange={(e) => setAllocQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? 'Оформление...' : 'Выдать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
