'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface SystemRole {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_users', name: 'Управление пользователями' },
  { id: 'manage_roles', name: 'Управление ролями' },
  { id: 'view_reports', name: 'Просмотр отчетов' },
  { id: 'manage_projects', name: 'Управление проектами' },
  { id: 'manage_kpi', name: 'Управление KPI' },
];

export default function RolesPage() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', permissions: [] as string[] });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) setRoles(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function saveRole(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = form.id ? `/api/roles/${form.id}` : '/api/roles';
      const method = form.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, permissions: form.permissions })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ id: '', name: '', permissions: [] });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteRole(id: string) {
    if (!confirm('Вы уверены, что хотите удалить эту роль?')) return;
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  }

  function openEdit(role: SystemRole) {
    setForm({ id: role.id, name: role.name, permissions: role.permissions });
    setIsModalOpen(true);
  }

  function togglePermission(permId: string) {
    if (form.permissions.includes(permId)) {
      setForm({ ...form, permissions: form.permissions.filter(p => p !== permId) });
    } else {
      setForm({ ...form, permissions: [...form.permissions, permId] });
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Роли и Доступы</h2>
          <p className="text-xs text-slate-500 mt-1">
            Настройка ролей команды и прав доступа в системе
          </p>
        </div>
        
        <button 
          onClick={() => {
            setForm({ id: '', name: '', permissions: [] });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm ring-1 ring-slate-900/10"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить роль</span>
        </button>
      </div>

      <div className="grid gap-4">
        {roles.map(role => (
          <div key={role.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <Shield className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{role.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-1">
                  {role.permissions.map(p => {
                    const known = AVAILABLE_PERMISSIONS.find(ap => ap.id === p);
                    return (
                      <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium border border-slate-200">
                        {known ? known.name : p}
                      </span>
                    );
                  })}
                  {role.permissions.length === 0 && <span className="text-slate-400">Нет особых прав</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(role)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteRole(role.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {roles.length === 0 && (
          <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Роли не найдены</p>
            <p className="text-xs text-slate-400 mt-1">Добавьте первую кастомную роль</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-700" />
                {form.id ? 'Редактировать роль' : 'Новая роль'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">Закрыть</button>
            </div>
            <form onSubmit={saveRole} className="p-4 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Название роли</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="Например: HR Менеджер" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Права доступа</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm.id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={form.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900" 
                      />
                      <span className="text-sm font-medium text-slate-700">{perm.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all">
                  {form.id ? 'Сохранить изменения' : 'Создать роль'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
