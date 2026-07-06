'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  FileText, 
  ArrowLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import VolunteerBottomNav from '@/components/VolunteerBottomNav';

interface KBCategory {
  id: string;
  name: string;
  description: string;
}

interface KBArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
  phone?: string | null;
  rating: number;
}

export default function VolunteerKBPage() {
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [volunteer, setVolunteer] = useState<User | null>(null);
  const [allVolunteers, setAllVolunteers] = useState<User[]>([]);
  
  // KB Data
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVolId, setSelectedVolId] = useState('');

  useEffect(() => {
    const cachedId = localStorage.getItem('volunteerId');
    setVolunteerId(cachedId);
    loadInitialData(cachedId);
  }, []);

  useEffect(() => {
    if (selectedCategoryId && volunteerId) {
      loadArticles();
    }
  }, [selectedCategoryId, volunteerId]);

  async function loadInitialData(currentId: string | null) {
    setLoading(true);
    try {
      const usersRes = await fetch('/api/users?role=volunteer');
      const usersData = await usersRes.json();
      setAllVolunteers(usersData);

      if (currentId) {
        const found = usersData.find((u: any) => u.id === currentId);
        if (found) {
          setVolunteer(found);
          const catRes = await fetch('/api/kb/categories');
          const catData = await catRes.json();
          setCategories(catData);
          if (catData.length > 0) {
            setSelectedCategoryId(catData[0].id);
          }
        } else {
          localStorage.removeItem('volunteerId');
          setVolunteerId(null);
        }
      }
    } catch (e) {
      console.error('Failed to load KB volunteer data', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadArticles() {
    try {
      const res = await fetch(`/api/kb/articles?category=${encodeURIComponent(selectedCategoryId)}`);
      const data = await res.json();
      setArticles(data);
      setSelectedArticle(null); // Reset selection
    } catch (e) {
      console.error('Failed to load articles', e);
    }
  }

  const handleLogin = () => {
    if (!selectedVolId) return;
    localStorage.setItem('volunteerId', selectedVolId);
    setVolunteerId(selectedVolId);
    loadInitialData(selectedVolId);
  };

  // Parse Markdown and sanitize the resulting HTML before rendering.
  const renderMarkdown = (md: string) => {
    try {
      return { __html: DOMPurify.sanitize(marked.parse(md) as string) };
    } catch (e) {
      return { __html: DOMPurify.sanitize(md) };
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
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">База знаний</h2>
            <p className="text-xs text-slate-500 mt-1">
              Выберите свой профиль для доступа к инструкциям
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

  // --- ARTICLE VIEW ---
  if (selectedArticle) {
    return (
      <div className="space-y-5 pb-6 animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => setSelectedArticle(null)}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к списку статей
        </button>

        {/* Article content glass card */}
        <div className="glass-panel bg-white p-5 border border-slate-200 shadow-sm rounded-2xl space-y-4">
          <h1 className="text-base font-bold text-slate-900 leading-tight">{selectedArticle.title}</h1>
          <span className="text-[10px] text-slate-400 block pb-2 border-b border-slate-100 font-medium">
            Опубликовано: {new Date(selectedArticle.created_at).toLocaleDateString('ru-RU')}
          </span>

          <div 
            className="prose prose-slate prose-sm text-slate-700 leading-relaxed space-y-4 max-w-none pt-2 
              prose-headings:text-slate-900 prose-headings:font-bold prose-h1:text-base prose-h2:text-sm prose-h3:text-xs 
              prose-strong:text-slate-900 prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-blockquote:border-l-4 prose-blockquote:border-slate-200 prose-blockquote:pl-4 prose-blockquote:italic
              prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5"
            dangerouslySetInnerHTML={renderMarkdown(selectedArticle.content)}
          />
        </div>

        <VolunteerBottomNav />
      </div>
    );
  }

  // Filter articles by search input
  const filteredArticles = articles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    art.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-6 animate-fade-in">
      <div className="flex items-center gap-2 px-1">
        <BookOpen className="w-5 h-5 text-slate-900" />
        <h2 className="text-base font-bold text-slate-900 leading-tight">База знаний волонтера</h2>
      </div>

      {/* Category selector slider */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 select-none scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border shrink-0 transition-all ${
              selectedCategoryId === cat.id
                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по памяткам и инструкциям..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
        />
      </div>

      {/* Articles list */}
      <div className="space-y-2.5">
        {filteredArticles.length === 0 ? (
          <div className="glass-panel bg-white p-8 text-center text-slate-400 text-xs border border-slate-200 shadow-sm rounded-xl py-12 flex flex-col items-center justify-center space-y-2">
            <Inbox className="w-6 h-6 text-slate-300" />
            <span>В этом разделе пока нет материалов</span>
          </div>
        ) : (
          filteredArticles.map((art) => (
            <button
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="w-full text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate">{art.title}</h4>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">
                    {new Date(art.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ))
        )}
      </div>

      <VolunteerBottomNav />
    </div>
  );
}
