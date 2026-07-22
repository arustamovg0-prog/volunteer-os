'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, AlertCircle, Trash2, Activity, User, Pencil, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface KPIParameter {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  weight: number;
  createdAt: string;
}

interface KPIGoal {
  id: string;
  kpiParameterId: string;
  userId: string;
  targetValue: number;
  currentValue: number;
  periodStart: string;
  periodEnd: string;
  parameter: KPIParameter;
}

interface SysUser {
  id: string;
  fullName: string;
  role: string;
}

export default function KPIPage() {
  const { t } = useTranslation();
  const [parameters, setParameters] = useState<KPIParameter[]>([]);
  const [goals, setGoals] = useState<KPIGoal[]>([]);
  const [users, setUsers] = useState<SysUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [editingParamId, setEditingParamId] = useState<string | null>(null);
  const [paramForm, setParamForm] = useState({ name: '', description: '', unit: 'points', weight: 1.0 });

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ kpiParameterId: '', userId: '', targetValue: '', periodStart: '', periodEnd: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [paramsRes, goalsRes, usersRes] = await Promise.all([
        fetch('/api/kpi/parameters'),
        fetch('/api/kpi/goals'), // For admin, this should return all or we might need an admin endpoint. Wait, currently it returns goals for the logged-in user. Let's fix backend later if needed, but for now we might only see our own goals unless we change backend.
        fetch('/api/users')
      ]);

      if (paramsRes.ok) setParameters(await paramsRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createParameter(e: React.FormEvent) {
    e.preventDefault();
    try {
      let res;
      if (editingParamId) {
        res = await fetch(`/api/kpi/parameters/${editingParamId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paramForm)
        });
      } else {
        res = await fetch('/api/kpi/parameters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paramForm)
        });
      }

      if (res.ok) {
        setIsParamModalOpen(false);
        setEditingParamId(null);
        setParamForm({ name: '', description: '', unit: 'points', weight: 1.0 });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteParameter(id: string) {
    if (!confirm('Вы уверены, что хотите удалить этот параметр?')) return;
    try {
      const res = await fetch(`/api/kpi/parameters/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function openEditParamModal(param: KPIParameter) {
    setEditingParamId(param.id);
    setParamForm({
      name: param.name,
      description: param.description || '',
      unit: param.unit,
      weight: param.weight
    });
    setIsParamModalOpen(true);
  }

  function handleCloseParamModal() {
    setIsParamModalOpen(false);
    setEditingParamId(null);
    setParamForm({ name: '', description: '', unit: 'points', weight: 1.0 });
  }

  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/kpi/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalForm)
      });
      if (res.ok) {
        setIsGoalModalOpen(false);
        setGoalForm({ kpiParameterId: '', userId: '', targetValue: '', periodStart: '', periodEnd: '' });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Управление KPI</h2>
          <p className="text-xs text-slate-500 mt-1">
            Настройка параметров эффективности и постановка целей
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setEditingParamId(null);
              setParamForm({ name: '', description: '', unit: 'points', weight: 1.0 });
              setIsParamModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm ring-1 ring-slate-900/10"
          >
            <Activity className="w-4 h-4" />
            <span>Новый Параметр</span>
          </button>
          <button 
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm ring-1 ring-emerald-600/10"
          >
            <Target className="w-4 h-4" />
            <span>Поставить Цель</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Parameters Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Справочник KPI параметров
          </h3>
          <div className="grid gap-3">
            {parameters.map(param => (
              <div key={param.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{param.name}</h4>
                    {param.description && <p className="text-xs text-slate-500 mt-0.5">{param.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md">
                        Вес: {param.weight}
                      </span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-md">
                        Ед: {param.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditParamModal(param)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteParameter(param.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {parameters.length === 0 && (
              <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">Параметры не найдены</p>
                <p className="text-xs text-slate-400 mt-1">Добавьте первый KPI параметр</p>
              </div>
            )}
          </div>
        </div>

        {/* Goals Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            Текущие цели (Мои)
          </h3>
          <div className="grid gap-3">
            {goals.map(goal => {
              const progress = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
              return (
                <div key={goal.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{goal.parameter?.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                        {new Date(goal.periodStart).toLocaleDateString()} — {new Date(goal.periodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900">{goal.currentValue}</span>
                      <span className="text-xs text-slate-500"> / {goal.targetValue} {goal.parameter?.unit}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl">
                <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">Цели не установлены</p>
                <p className="text-xs text-slate-400 mt-1">Поставьте первую цель</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isParamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingParamId ? 'Редактировать параметр' : 'Новый KPI Параметр'}
              </h3>
              <button onClick={handleCloseParamModal} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createParameter} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Название параметра</label>
                <input required type="text" value={paramForm.name} onChange={e => setParamForm({...paramForm, name: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Например: Отработанные часы" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Описание (опционально)</label>
                <textarea value={paramForm.description} onChange={e => setParamForm({...paramForm, description: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Что измеряет этот параметр?"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Единица измерения</label>
                  <input required type="text" value={paramForm.unit} onChange={e => setParamForm({...paramForm, unit: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="часы, шт, баллы" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Вес (значимость)</label>
                  <input required type="number" step="0.1" value={paramForm.weight} onChange={e => setParamForm({...paramForm, weight: parseFloat(e.target.value)})} className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all">
                  Создать параметр
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                Постановка цели
              </h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-slate-600">Закрыть</button>
            </div>
            <form onSubmit={createGoal} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Сотрудник / Волонтер</label>
                <select required value={goalForm.userId} onChange={e => setGoalForm({...goalForm, userId: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg">
                  <option value="">Выберите пользователя</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">KPI Параметр</label>
                <select required value={goalForm.kpiParameterId} onChange={e => setGoalForm({...goalForm, kpiParameterId: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg">
                  <option value="">Выберите параметр</option>
                  {parameters.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Целевое значение</label>
                <input required type="number" step="0.1" value={goalForm.targetValue} onChange={e => setGoalForm({...goalForm, targetValue: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Начало периода</label>
                  <input required type="date" value={goalForm.periodStart} onChange={e => setGoalForm({...goalForm, periodStart: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Конец периода</label>
                  <input required type="date" value={goalForm.periodEnd} onChange={e => setGoalForm({...goalForm, periodEnd: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 transition-all">
                  Установить цель
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
