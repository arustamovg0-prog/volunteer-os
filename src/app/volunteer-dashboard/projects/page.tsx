'use client';

import { useState, useEffect } from 'react';
import { 
  Folder, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ArrowRight,
  Sparkles,
  Inbox,
  User,
  Check,
  Map,
  Compass,
  Navigation
} from 'lucide-react';
import VolunteerBottomNav from '@/components/VolunteerBottomNav';

interface Task {
  id: string;
  project_id: string;
  assigned_to?: string | null;
  title: string;
  deadline: string;
  status: 'pending' | 'accepted' | 'completed';
  is_overdue: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed';
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  latitude?: number;
  longitude?: number;
  org_id?: string | null;
}

interface User {
  id: string;
  full_name: string;
  role: string;
  phone?: string | null;
  rating: number;
  latitude?: number;
  longitude?: number;
  skills?: string[];
}

interface VolunteerOrganization {
  id: string;
  name: string;
  description: string;
  category: string;
  contacts: string;
  created_at: string;
}

// Haversine formula to calculate distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function VolunteerProjectsPage() {
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [volunteer, setVolunteer] = useState<User | null>(null);
  const [allVolunteers, setAllVolunteers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [organizations, setOrganizations] = useState<VolunteerOrganization[]>([]);
  const [loading, setLoading] = useState(true);

  // Map view & filters states
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [radiusFilter, setRadiusFilter] = useState<number>(15);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Sign-in Form State
  const [selectedVolId, setSelectedVolId] = useState('');
  
  // Action State
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const cachedId = localStorage.getItem('volunteerId');
    setVolunteerId(cachedId);
    loadInitialData(cachedId);
  }, []);

  async function loadInitialData(currentId: string | null) {
    setLoading(true);
    try {
      const usersRes = await fetch('/api/users');
      const usersData: User[] = await usersRes.json();
      const vols = usersData.filter(u => u.role === 'volunteer');
      setAllVolunteers(vols);

      if (currentId) {
        const found = vols.find(u => u.id === currentId);
        if (found) {
          setVolunteer(found);
          const [projectsRes, tasksRes, orgsRes] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/tasks'),
            fetch('/api/organizations')
          ]);
          setProjects(await projectsRes.json());
          setTasks(await tasksRes.json());
          setOrganizations(await orgsRes.json());
        } else {
          localStorage.removeItem('volunteerId');
          setVolunteerId(null);
        }
      }
    } catch (e) {
      console.error('Failed to load volunteer projects data', e);
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = () => {
    if (!selectedVolId) return;
    localStorage.setItem('volunteerId', selectedVolId);
    setVolunteerId(selectedVolId);
    loadInitialData(selectedVolId);
  };

  const handleClaimTask = async (taskId: string) => {
    if (!volunteerId) return;
    setClaimingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assigned_to: volunteerId,
          status: 'accepted'
        })
      });
      if (res.ok) {
        setAlertMessage('Задача успешно взята в работу!');
        setTimeout(() => setAlertMessage(null), 3000);
        // Refresh tasks
        const tasksRes = await fetch('/api/tasks');
        setTasks(await tasksRes.json());
      }
    } catch (e) {
      console.error('Failed to claim task', e);
    } finally {
      setClaimingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // --- SIGN-IN SCREEN ---
  if (!volunteerId || !volunteer) {
    return (
      <main className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-center animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Проекты ассоциации</h2>
            <p className="text-xs text-slate-500 mt-1">
              Выберите свой профиль для доступа к списку проектов
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ваш профиль</label>
              <select
                value={selectedVolId}
                onChange={(e) => setSelectedVolId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              >
                <option value="">-- Выберите профиль --</option>
                {allVolunteers.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.full_name} ({v.phone || 'без телефона'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLogin}
              disabled={!selectedVolId}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:text-slate-400"
            >
              Войти в кабинет
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Filter projects (show active and planning first)
  const activeAndPlanning = projects.filter(p => p.status !== 'completed');
  const completedProjects = projects.filter(p => p.status === 'completed');

  const getProjectCategory = (project: Project) => {
    const org = organizations.find(o => o.id === project.org_id);
    return org ? org.category : 'Экология';
  };

  const categoryColors: Record<string, { fill: string; stroke: string; bg: string; text: string }> = {
    'Экология': { fill: '#10B981', stroke: '#047857', bg: 'bg-emerald-50 border-emerald-250', text: 'text-emerald-700' },
    'Защита животных': { fill: '#8B5CF6', stroke: '#6D28D9', bg: 'bg-purple-50 border-purple-250', text: 'text-purple-700' },
    'Социальная помощь': { fill: '#0EA5E9', stroke: '#0369A1', bg: 'bg-sky-50 border-sky-250', text: 'text-sky-700' },
    'Здравоохранение': { fill: '#F43F5E', stroke: '#BE123C', bg: 'bg-rose-50 border-rose-250', text: 'text-rose-700' },
    'Образование': { fill: '#F59E0B', stroke: '#B45309', bg: 'bg-amber-50 border-amber-250', text: 'text-amber-700' }
  };

  const getCategoryColor = (cat: string) => {
    return categoryColors[cat] || { fill: '#64748B', stroke: '#334155', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' };
  };

  const vLat = volunteer?.latitude || 41.311;
  const vLng = volunteer?.longitude || 69.240;

  // Filter projects by distance & category for the map and radial view
  const mapProjects = activeAndPlanning.filter(p => {
    const pLat = p.latitude || 41.311;
    const pLng = p.longitude || 69.240;
    const distance = getDistance(vLat, vLng, pLat, pLng);
    
    // Radius filter
    if (distance > radiusFilter) return false;
    
    // Category filter
    if (selectedCategory !== 'all') {
      const cat = getProjectCategory(p);
      if (cat !== selectedCategory) return false;
    }
    
    return true;
  });

  // SVG Projection parameters
  const mapBounds = {
    minLat: 41.26,
    maxLat: 41.36,
    minLng: 69.17,
    maxLng: 69.31
  };

  const projectX = (lng: number) => {
    return ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 500;
  };

  const projectY = (lat: number) => {
    return 350 - ((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * 350;
  };

  const getPixelRadius = (radiusKm: number) => {
    const lngDiff = radiusKm / 83.3;
    const xCenter = projectX(vLng);
    const xEdge = projectX(vLng + lngDiff);
    return Math.abs(xEdge - xCenter);
  };

  const latLines = [41.28, 41.30, 41.32, 41.34];
  const lngLines = [69.18, 69.20, 69.22, 69.24, 69.26, 69.28, 69.30];

  return (
    <div className="space-y-5 pb-20 animate-fade-in px-1 bg-[#F9FAFB] min-h-screen">
      {/* Toast Alert */}
      {alertMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs shadow-lg flex items-center gap-2 animate-fade-in border border-slate-800">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-slate-900" />
          <h2 className="text-base font-bold text-slate-900 leading-tight">Проекты ассоциации</h2>
        </div>
        
        {/* Toggle List / Map View */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1 ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Списком
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1 ${
              viewMode === 'map'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            <Map className="w-3 h-3" />
            На карте
          </button>
        </div>
      </div>

      {/* Current Volunteer Profile Card */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-[10px] text-slate-500 flex items-center justify-between shadow-sm">
        <span>Волонтер: <span className="text-slate-800 font-bold">{volunteer.full_name}</span></span>
        <span className="flex items-center gap-1">
          Рейтинг: <span className="text-slate-900 font-bold">{volunteer.rating ? volunteer.rating.toFixed(2) : '5.00'}</span>
        </span>
      </div>

      {/* Search filters block: visible in both views but essential for map */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-3">
        {/* Radius Filter */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-505">
            <span className="flex items-center gap-1">Радиус поиска проектов</span>
            <span className="text-slate-900 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">{radiusFilter} км</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={radiusFilter}
            onChange={(e) => setRadiusFilter(Number(e.target.value))}
            className="w-full accent-slate-900 h-1 bg-slate-100 rounded-lg cursor-pointer"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="space-y-1.5">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Категория</span>
          <div className="flex flex-wrap gap-1">
            {['all', 'Экология', 'Защита животных', 'Социальная помощь', 'Здравоохранение', 'Образование'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded-lg text-[9px] font-semibold border transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-605 hover:bg-slate-150'
                }`}
              >
                {cat === 'all' ? 'Все' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RENDER VIEW: MAP OR LIST */}
      {viewMode === 'map' ? (
        <div className="space-y-4">
          {/* Custom SVG Interactive Map Container */}
          <div className="relative border border-slate-200 rounded-2xl bg-[#F8FAFC] overflow-hidden shadow-sm h-[350px]">
            <svg viewBox="0 0 500 350" className="w-full h-full select-none">
              {/* Grid Lines */}
              {latLines.map(lat => {
                const y = projectY(lat);
                return (
                  <g key={`lat-${lat}`}>
                    <line x1="0" y1={y} x2="500" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                    <text x="6" y={y - 4} className="fill-slate-400 text-[7px] font-mono pointer-events-none">{lat.toFixed(2)}N</text>
                  </g>
                );
              })}
              {lngLines.map(lng => {
                const x = projectX(lng);
                return (
                  <g key={`lng-${lng}`}>
                    <line x1={x} y1="0" x2={x} y2="350" stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                    <text x={x + 4} y="343" className="fill-slate-400 text-[7px] font-mono pointer-events-none">{lng.toFixed(2)}E</text>
                  </g>
                );
              })}

              {/* District Background Labels (Tashkent Region Mockup) */}
              <text x={projectX(69.270)} y={projectY(41.345)} className="fill-slate-350/60 font-black uppercase text-[10px] tracking-widest pointer-events-none text-center">ЮНУСАБАД</text>
              <text x={projectX(69.200)} y={projectY(41.280)} className="fill-slate-350/60 font-black uppercase text-[10px] tracking-widest pointer-events-none text-center">ЧИЛАНЗАР</text>
              <text x={projectX(69.275)} y={projectY(41.300)} className="fill-slate-350/60 font-black uppercase text-[10px] tracking-widest pointer-events-none text-center">МИРАБАД</text>
              <text x={projectX(69.300)} y={projectY(41.305)} className="fill-slate-350/60 font-black uppercase text-[10px] tracking-widest pointer-events-none text-center">ЯШНАБАД</text>
              <text x={projectX(69.245)} y={projectY(41.315)} className="fill-slate-350/60 font-black uppercase text-[10px] tracking-widest pointer-events-none text-center">ЦЕНТР</text>

              {/* Compass Rose */}
              <g transform="translate(460, 40)" className="opacity-30 pointer-events-none">
                <circle r="14" fill="none" stroke="#64748B" strokeWidth="1" />
                <path d="M0 -16 L3 -3 L16 0 L3 3 L0 16 L-3 3 L-16 0 L-3 -3 Z" fill="#64748B" />
                <path d="M0 -16 L0 0 L3 -3 Z" fill="#334155" />
                <path d="M16 0 L0 0 L3 3 Z" fill="#334155" />
                <path d="M0 16 L0 0 L-3 3 Z" fill="#334155" />
                <path d="M-16 0 L0 0 L-3 -3 Z" fill="#334155" />
                <text x="-3.5" y="-18" className="fill-slate-600 text-[8px] font-black">N</text>
              </g>

              {/* Scale Bar */}
              <g transform="translate(20, 315)" className="opacity-40 pointer-events-none">
                <line x1="0" y1="0" x2="85.7" y2="0" stroke="#475569" strokeWidth="1.5" />
                <line x1="0" y1="-3" x2="0" y2="3" stroke="#475569" strokeWidth="1.5" />
                <line x1="85.7" y1="-3" x2="85.7" y2="3" stroke="#475569" strokeWidth="1.5" />
                <text x="28" y="-5" className="fill-slate-600 text-[7px] font-bold font-mono">2 km</text>
              </g>

              {/* Radial search distance boundaries centered on volunteer */}
              <circle 
                cx={projectX(vLng)} 
                cy={projectY(vLat)} 
                r={getPixelRadius(radiusFilter)} 
                fill="none" 
                stroke="#475569" 
                strokeDasharray="4 4" 
                strokeWidth="1.5" 
                opacity="0.3" 
              />

              {/* Connector line between Volunteer and Selected Project */}
              {selectedProject && (
                <line 
                  x1={projectX(vLng)} 
                  y1={projectY(vLat)} 
                  x2={projectX(selectedProject.longitude || vLng)} 
                  y2={projectY(selectedProject.latitude || vLat)} 
                  stroke="#0F172A" 
                  strokeDasharray="3 3" 
                  strokeWidth="1.5"
                  className="opacity-70 animate-pulse"
                />
              )}

              {/* Volunteer Location Marker */}
              <g>
                <circle cx={projectX(vLng)} cy={projectY(vLat)} r="12" fill="#3B82F6" opacity="0.25" className="animate-pulse" />
                <circle cx={projectX(vLng)} cy={projectY(vLat)} r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" className="shadow" />
              </g>

              {/* Project Markers */}
              {mapProjects.map((p) => {
                const px = projectX(p.longitude || vLng);
                const py = projectY(p.latitude || vLat);
                const category = getProjectCategory(p);
                const colorDetails = getCategoryColor(category);

                return (
                  <g 
                    key={`pin-${p.id}`}
                    transform={`translate(${px}, ${py})`}
                    className="cursor-pointer"
                    onClick={() => setSelectedProject(p)}
                  >
                    {/* SVG Drop Pin pointing exactly at coordinate (0,0) */}
                    <path 
                      d="M0 0 C-4 -4 -8 -8 -8 -15 C-8 -20 -4.5 -24 0 -24 C4.5 -24 8 -20 8 -15 C8 -8 4 -4 0 0 Z" 
                      fill={colorDetails.fill} 
                      stroke="#FFFFFF" 
                      strokeWidth="2" 
                      className={`transition-all duration-200 ${selectedProject?.id === p.id ? 'scale-125 filter drop-shadow' : 'hover:scale-110'}`}
                    />
                    <circle cx="0" cy="-15" r="3.5" fill="#FFFFFF" />
                  </g>
                );
              })}
            </svg>

            {/* Google Maps style floating card for Selected Project */}
            {selectedProject && (
              <div className="absolute bottom-3 left-3 right-3 bg-white border border-slate-200 p-3 rounded-xl shadow-lg animate-fade-in flex flex-col gap-1.5 z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${getCategoryColor(getProjectCategory(selectedProject)).bg} ${getCategoryColor(getProjectCategory(selectedProject)).text}`}>
                        {getProjectCategory(selectedProject)}
                      </span>
                      <span className="text-[8px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200 font-extrabold uppercase">
                        {selectedProject.status === 'planning' ? 'Подготовка' : 'Активен'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-950 text-[11px] leading-tight mt-0.5">{selectedProject.title}</h4>
                  </div>
                  <button 
                    onClick={() => setSelectedProject(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all"
                  >
                    x
                  </button>
                </div>
                
                <p className="text-[9px] text-slate-500 line-clamp-2 leading-relaxed">
                  {selectedProject.description || 'Описание отсутствует.'}
                </p>
                
                <div className="flex items-center justify-between border-t border-slate-150 pt-2 mt-1">
                  <span className="text-[9px] text-slate-600 font-bold flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-slate-400" />
                    - {getDistance(vLat, vLng, selectedProject.latitude || vLat, selectedProject.longitude || vLng).toFixed(1)} км от вас
                  </span>
                  
                  <button
                    onClick={() => {
                      setViewMode('list');
                      setTimeout(() => {
                        const el = document.getElementById(`project-${selectedProject.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[8px] uppercase tracking-wider shadow-sm transition-all"
                  >
                    Задачи проекта
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* List of projects that match the map filter (within radius) */}
          <div className="space-y-2.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider px-1">
              Проекты в радиусе {radiusFilter} км ({mapProjects.length})
            </span>
            {mapProjects.length === 0 ? (
              <div className="bg-white p-8 text-center text-slate-400 text-xs border border-slate-200 shadow-sm rounded-xl py-10">
                В выбранном радиусе нет проектов с активными задачами.
              </div>
            ) : (
              <div className="space-y-2">
                {mapProjects.map(p => {
                  const dist = getDistance(vLat, vLng, p.latitude || vLat, p.longitude || vLng);
                  const cat = getProjectCategory(p);
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => {
                        setSelectedProject(p);
                      }}
                      className={`p-3 rounded-xl border bg-white flex items-center justify-between gap-3 shadow-sm hover:border-slate-350 transition-all cursor-pointer ${selectedProject?.id === p.id ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'}`}
                    >
                      <div className="space-y-1">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${getCategoryColor(cat).bg} ${getCategoryColor(cat).text}`}>
                          {cat}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-0.5">{p.title}</h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-800 font-bold block"> {dist.toFixed(1)} км</span>
                        <span className="text-[8px] text-slate-400">Показать на карте</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Текущие и запланированные проекты ({activeAndPlanning.length})
          </h3>

          {activeAndPlanning.length === 0 ? (
            <div className="glass-panel bg-white p-8 text-center text-slate-400 text-xs border border-slate-200 shadow-sm rounded-xl py-12">
              Нет активных проектов в настоящее время.
            </div>
          ) : (
            <div className="space-y-4">
              {activeAndPlanning.map((project) => {
                const projectTasks = tasks.filter(t => t.project_id === project.id);
                const myTasks = projectTasks.filter(t => t.assigned_to === volunteerId);
                const openTasks = projectTasks.filter(t => !t.assigned_to && t.status !== 'completed');
                const completedTasksCount = projectTasks.filter(t => t.status === 'completed').length;
                const progressPercent = projectTasks.length > 0 
                  ? Math.round((completedTasksCount / projectTasks.length) * 100) 
                  : 0;

                const statusBadge = {
                  planning: 'bg-amber-50 text-amber-700 border-amber-250',
                  active: 'bg-blue-50 text-blue-700 border-blue-250',
                  completed: 'bg-emerald-50 text-emerald-700 border-emerald-250'
                }[project.status];

                const statusText = {
                  planning: 'Подготовка',
                  active: 'Активен',
                  completed: 'Завершен'
                }[project.status];

                return (
                  <div key={project.id} id={`project-${project.id}`} className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 shadow-sm scroll-mt-6">
                    {/* Top: Status & Date info */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusBadge}`}>
                        {statusText}
                      </span>
                      {project.start_date && (
                        <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(project.start_date).toLocaleDateString('ru-RU')} 
                          {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString('ru-RU')}`}
                        </span>
                      )}
                    </div>

                    {/* Mid: Title & Description */}
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">{project.title}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {project.description || 'Описание проекта отсутствует.'}
                      </p>
                    </div>

                    {/* Project Progress bar */}
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span>Общий прогресс проекта</span>
                        <span className="font-bold text-slate-900">{completedTasksCount} / {projectTasks.length} ({progressPercent}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-150 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-slate-900 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Volunteer tasks within this project */}
                    {myTasks.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Мои задачи в проекте ({myTasks.length})</span>
                        <div className="space-y-1.5">
                          {myTasks.map(task => (
                            <div key={task.id} className="p-2 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-slate-800 truncate pr-3">{task.title}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                task.status === 'completed' 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : task.status === 'accepted' 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'bg-amber-50 text-amber-700'
                              }`}>
                                {task.status === 'completed' ? 'Выполнена' : task.status === 'accepted' ? 'В работе' : 'Ожидает'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Open tasks for this project (unassigned) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Свободные задачи ({openTasks.length})</span>
                      {openTasks.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">Свободных задач пока нет. Все распределены!</p>
                      ) : (
                        <div className="space-y-1.5">
                          {openTasks.map(task => (
                            <div key={task.id} className="p-2 rounded-lg bg-slate-50/50 border border-slate-150 flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-3">
                                <span className="font-medium text-slate-800 text-[10px] leading-tight">{task.title}</span>
                                <span className="text-[8px] text-slate-400 shrink-0 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-350" />
                                  до {new Date(task.deadline).toLocaleDateString('ru-RU')}
                                </span>
                              </div>
                              <button
                                onClick={() => handleClaimTask(task.id)}
                                disabled={claimingTaskId === task.id}
                                className="py-1 px-2.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[9px] transition-all cursor-pointer self-end flex items-center gap-1"
                              >
                                {claimingTaskId === task.id ? 'Беру...' : 'Взять себе'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed / Archive Projects */}
      {completedProjects.length > 0 && viewMode === 'list' && (
        <div className="space-y-3 pt-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Завершенные проекты ({completedProjects.length})
          </h3>

          <div className="space-y-2">
            {completedProjects.map((project) => (
              <div key={project.id} className="p-3.5 rounded-xl bg-white border border-slate-100 opacity-60 space-y-1 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-700 text-[11px] truncate max-w-[70%]">{project.title}</h4>
                  <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[8px] font-bold">Завершен</span>
                </div>
                <p className="text-[9px] text-slate-400 line-clamp-1">{project.description || 'Без описания'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
