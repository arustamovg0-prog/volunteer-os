'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Save, 
  FileText,
  Calendar,
  X,
  Tag
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

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
  file_url?: string | null;
  created_at: string;
}

export default function KnowledgeBasePage() {
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Current authenticated role
  const [role, setRole] = useState('manager');

  // New Category Form State
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // New Article Form State
  const [showNewArticleModal, setShowNewArticleModal] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState('');
  const [newArticleContent, setNewArticleContent] = useState('');
  const [newArticleCategory, setNewArticleCategory] = useState('');

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole');
    if (savedRole) setRole(savedRole);

    const handleRoleChange = () => {
      const updated = localStorage.getItem('currentUserRole');
      if (updated) setRole(updated);
    };

    window.addEventListener('auth-session-change', handleRoleChange);
    loadCategories();

    return () => window.removeEventListener('auth-session-change', handleRoleChange);
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadArticles();
    }
  }, [selectedCategoryId]);

  async function loadCategories(selectId?: string) {
    try {
      const res = await fetch('/api/kb/categories');
      const data = await res.json();
      setCategories(data);
      if (data.length > 0) {
        const nextId = selectId || data[0].id;
        setSelectedCategoryId(nextId);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadArticles() {
    try {
      const res = await fetch(`/api/kb/articles?category=${encodeURIComponent(selectedCategoryId)}`);
      const data = await res.json();
      setArticles(data);
      
      // Auto select first article if available
      if (data.length > 0) {
        loadArticleDetails(data[0].id);
      } else {
        setSelectedArticle(null);
        setIsEditing(false);
      }
    } catch (e) {
      console.error('Failed to load articles', e);
    }
  }

  async function loadArticleDetails(id: string) {
    try {
      const res = await fetch(`/api/kb/articles/${id}`);
      const data = await res.json();
      setSelectedArticle(data);
      setEditTitle(data.title);
      setEditContent(data.content);
      setEditCategory(data.category);
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to load article details', e);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/kb/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc })
      });
      if (res.ok) {
        const created = await res.json();
        setShowNewCategoryModal(false);
        setNewCategoryName('');
        setNewCategoryDesc('');
        // Reload and force-select the new category
        await loadCategories(created.id);
      }
    } catch (e) {
      console.error('Failed to create category', e);
    }
  }

  async function handleCreateArticle(e: React.FormEvent) {
    e.preventDefault();
    const categoryToUse = newArticleCategory || selectedCategoryId;
    if (!newArticleTitle.trim() || !newArticleContent.trim() || !categoryToUse) return;

    try {
      const res = await fetch('/api/kb/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryToUse,
          title: newArticleTitle,
          content: newArticleContent
        })
      });
      if (res.ok) {
        const created = await res.json();
        setShowNewArticleModal(false);
        setNewArticleTitle('');
        setNewArticleContent('');
        
        // If article was created in a different category, switch to it
        if (categoryToUse !== selectedCategoryId) {
          setSelectedCategoryId(categoryToUse);
        } else {
          await loadArticles();
        }
      }
    } catch (e) {
      console.error('Failed to create article', e);
    }
  }

  async function handleSaveEdits() {
    if (!selectedArticle || !editTitle.trim() || !editContent.trim()) return;

    try {
      const res = await fetch(`/api/kb/articles/${selectedArticle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          category: editCategory
        })
      });
      if (res.ok) {
        setIsEditing(false);
        await loadArticleDetails(selectedArticle.id);
        // If category changed, reload all to reflect changes
        if (editCategory !== selectedCategoryId) {
          await loadCategories(editCategory);
        } else {
          await loadArticles();
        }
      }
    } catch (e) {
      console.error('Failed to save edits', e);
    }
  }

  // Filter articles by search input
  const filteredArticles = articles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    art.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="h-full flex items-center justify-center py-24 bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">База знаний</h2>
          <p className="text-xs text-slate-500 mt-1">
            Инструкции, регламенты и методические материалы для волонтеров
          </p>
        </div>
        
        {role === 'admin' && (
          <button
            onClick={() => {
              setNewArticleCategory(selectedCategoryId);
              setShowNewArticleModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Добавить статью
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Column 1: Categories list */}
        <div className="lg:col-span-1 glass-panel bg-white p-5 border border-slate-200 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Разделы</h3>
            {role === 'admin' && (
              <button 
                onClick={() => setShowNewCategoryModal(true)}
                className="p-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-800 transition-all"
                title="Добавить раздел"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                  selectedCategoryId === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategoryId === cat.id ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cat.id === selectedCategoryId ? articles.length : ''}
                </span>
              </button>
            ))}
          </div>

          {selectedCategoryId && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold block text-slate-700 mb-1">Описание раздела:</span>
              {categories.find(c => c.id === selectedCategoryId)?.description || 'Нет описания раздела.'}
            </div>
          )}
        </div>

        {/* Column 2: Article List */}
        <div className="lg:col-span-1 glass-panel bg-white p-5 border border-slate-200 shadow-sm rounded-xl flex flex-col space-y-4 min-h-[500px]">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск статей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Материалы</h3>
          </div>

          {/* Articles list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[400px]">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                {searchQuery ? 'Ничего не найдено' : 'Раздел пуст'}
              </div>
            ) : (
              filteredArticles.map((art) => (
                <button
                  key={art.id}
                  onClick={() => loadArticleDetails(art.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedArticle?.id === art.id
                      ? 'bg-slate-50 border-slate-300 text-slate-900 font-medium'
                      : 'bg-white border-slate-100 text-slate-600 hover:text-slate-900 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs truncate font-semibold">
                        {art.title}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">{new Date(art.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Article Details / Editor */}
        <div className="lg:col-span-2 glass-panel bg-white p-6 border border-slate-200 shadow-sm rounded-xl min-h-[500px]">
          {selectedArticle ? (
            isEditing ? (
              // EDIT MODE
              <div className="space-y-5 flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Редактирование статьи</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSaveEdits}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Сохранить
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Название статьи</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Раздел / Категория</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 flex flex-col space-y-1.5 min-h-[300px]">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Содержимое (Markdown)</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 w-full p-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 resize-none leading-relaxed"
                  />
                </div>
              </div>
            ) : (
              // VIEW MODE
              <div className="space-y-5">
                {/* Actions bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {selectedArticle.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(selectedArticle.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  
                  {role === 'admin' && (
                    <button
                      onClick={() => {
                        setEditTitle(selectedArticle.title);
                        setEditContent(selectedArticle.content);
                        setEditCategory(selectedArticle.category);
                        setIsEditing(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Редактировать
                    </button>
                  )}
                </div>

                {/* Article Content */}
                <div className="space-y-4">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{selectedArticle.title}</h1>
                  
                  <div 
                    className="prose prose-slate prose-sm text-slate-700 leading-relaxed space-y-4 max-w-none pt-4 
                      prose-headings:text-slate-900 prose-headings:font-bold prose-h1:text-lg prose-h2:text-sm prose-h3:text-xs 
                      prose-strong:text-slate-900 prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                      prose-blockquote:border-l-4 prose-blockquote:border-slate-200 prose-blockquote:pl-4 prose-blockquote:italic
                      prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5"
                    dangerouslySetInnerHTML={renderMarkdown(selectedArticle.content)}
                  />
                </div>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 py-24">
              <BookOpen className="w-10 h-10 text-slate-300" />
              <p className="text-slate-400 text-xs">Выберите статью для просмотра её содержимого</p>
            </div>
          )}
        </div>
      </div>

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Создать новый раздел</h3>
              <button onClick={() => setShowNewCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium">Название раздела</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Инструкции, Пароли и контакты"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium">Описание раздела</label>
                <textarea
                  placeholder="Опишите, какие материалы будут храниться в этом разделе"
                  rows={3}
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Article Modal */}
      {showNewArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Создать новую статью</h3>
              <button onClick={() => setShowNewArticleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium">Заголовок</label>
                <input
                  type="text"
                  required
                  placeholder="Введите название статьи"
                  value={newArticleTitle}
                  onChange={(e) => setNewArticleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium">Раздел / Категория</label>
                <select
                  value={newArticleCategory}
                  onChange={(e) => setNewArticleCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium">Содержимое (Поддерживается Markdown)</label>
                <textarea
                  required
                  placeholder="# Заголовок статьи&#10;&#10;Текст статьи с разметкой markdown. Например:&#10;- Список 1&#10;- Список 2&#10;&#10;**Жирный текст**"
                  rows={8}
                  value={newArticleContent}
                  onChange={(e) => setNewArticleContent(e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl text-xs font-mono placeholder:text-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewArticleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  Создать статью
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
