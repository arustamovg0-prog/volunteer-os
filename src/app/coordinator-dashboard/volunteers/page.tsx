'use client';

import { useEffect, useState } from 'react';
import { Users2, Search, Star, Award, Phone, Shield, CheckCircle2 } from 'lucide-react';

interface Volunteer {
  id: string;
  full_name: string;
  login?: string;
  phone?: string;
  rating?: number;
  xp?: number;
  level?: number;
  is_senior?: boolean;
  availability_status?: string;
}

export default function CoordinatorVolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'senior'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadVolunteers();
  }, []);

  async function loadVolunteers() {
    setLoading(true);
    try {
      const res = await fetch('/api/volunteers', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setVolunteers(data || []);
      }
    } catch (e) {
      console.error('Failed to load volunteers:', e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSeniorStatus(vol: Volunteer) {
    setTogglingId(vol.id);
    const newStatus = !vol.is_senior;

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: vol.id, is_senior: newStatus }),
      });

      if (res.ok) {
        setVolunteers(prev =>
          prev.map(v => (v.id === vol.id ? { ...v, is_senior: newStatus } : v))
        );
      }
    } catch (e) {
      console.error('Failed to update senior status:', e);
    } finally {
      setTogglingId(null);
    }
  }

  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch =
      v.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (v.login && v.login.toLowerCase().includes(search.toLowerCase())) ||
      (v.phone && v.phone.includes(search));

    const matchesTab = tabFilter === 'all' ? true : v.is_senior;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Волонтеры проектов</h1>
        <p className="text-sm text-slate-500">Просмотр и назначение статуса Старших волонтеров в ваших проектах</p>
      </div>

      {/* Filter and Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setTabFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tabFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Все волонтеры ({volunteers.length})
          </button>
          <button
            onClick={() => setTabFilter('senior')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tabFilter === 'senior'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            ⭐ Старшие ({volunteers.filter(v => v.is_senior).length})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-medium">Загружаем список...</span>
          </div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <Users2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Волонтеры не найдены</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVolunteers.map((vol) => (
              <div key={vol.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                    {vol.full_name ? vol.full_name.charAt(0).toUpperCase() : 'V'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{vol.full_name}</span>
                      {vol.is_senior && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold flex items-center gap-1">
                          ⭐ Старший
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      {vol.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {vol.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        Рейтинг: {vol.rating ? vol.rating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <button
                    onClick={() => toggleSeniorStatus(vol)}
                    disabled={togglingId === vol.id}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      vol.is_senior
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${vol.is_senior ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                    {vol.is_senior ? 'Снять старшего' : 'Сделать старшим'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
