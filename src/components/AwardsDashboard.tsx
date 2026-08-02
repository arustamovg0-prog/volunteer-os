'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Send, Plus, LayoutTemplate, Trash2, Edit3, Award, Users, Filter, CheckCircle2, Loader2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  title: string;
  bodyText: string;
  signature: string;
  primaryColor: string;
  accentColor: string;
}

export default function AwardsDashboard({ role }: { role: string }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'send' | 'templates'>('send');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [filterType, setFilterType] = useState<'project' | 'organization' | 'active' | 'all'>('project');
  const [filterId, setFilterId] = useState('');
  const [limit, setLimit] = useState<number | ''>('');
  
  const [projects, setProjects] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // Template Form State
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: 'СЕРТИФИКАТ ВОЛОНТЕРА',
    bodyText: 'Настоящим подтверждается, что {{name}} принял(а) активное участие в проекте "{{project}}" и внес(ла) вклад в размере {{hours}} часов.',
    signature: 'Имя Фамилия (Должность)',
    primaryColor: '#0ea5e9',
    accentColor: '#0f172a'
  });

  useEffect(() => {
    fetchTemplates();
    fetchProjects();
    fetchOrganizations();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const url = editingTemplateId ? `/api/templates/${editingTemplateId}` : '/api/templates';
      const method = editingTemplateId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsEditingTemplate(false);
        setEditingTemplateId(null);
        fetchTemplates();
      } else {
        alert('Ошибка при сохранении шаблона');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении шаблона');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendAwards = async () => {
    if (!selectedTemplate) return alert('Выберите шаблон!');
    if (filterType === 'project' && !filterId) return alert('Выберите проект!');
    if (filterType === 'organization' && !filterId) return alert('Выберите организацию!');
    
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/awards/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          filterType: filterType === 'organization' ? 'org' : filterType,
          filterId,
          limit: limit || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSendResult(data);
      } else {
        alert(data.error || 'Ошибка при отправке наград');
      }
    } catch (e) {
      console.error(e);
      alert('Произошла ошибка при отправке');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loader2 className="w-8 h-8 animate-spin mx-auto mt-12 text-blue-600" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Награждение</h1>
          <p className="text-sm text-slate-500">Отправляйте сертификаты и благодарственные письма волонтерам</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100 p-1 flex bg-slate-50/50">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'send' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            <Send className="w-4 h-4" />
            Массовая Отправка
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'templates' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            Шаблоны
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'send' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Шаблон награды</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                    >
                      <option value="">Выберите шаблон...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Кому отправлять?</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                    >
                      <option value="project">Волонтерам определенного проекта</option>
                      <option value="organization">Всем волонтерам организации</option>
                      <option value="active">Самым активным волонтерам</option>
                      <option value="all">Всем волонтерам</option>
                    </select>
                  </div>

                  {filterType === 'project' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Выберите проект</label>
                      <select
                        value={filterId}
                        onChange={(e) => setFilterId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                      >
                        <option value="">Выберите проект...</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {filterType === 'organization' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Выберите организацию</label>
                      <select
                        value={filterId}
                        onChange={(e) => setFilterId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                      >
                        <option value="">Выберите организацию...</option>
                        {organizations.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {filterType === 'active' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Количество (топ N волонтеров)</label>
                      <input
                        type="number"
                        min="1"
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value) || '')}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                        placeholder="Например: 10"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSendAwards}
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {sending ? 'Отправка...' : 'Отправить Награды'}
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Результаты отправки
                  </h3>
                  
                  {sendResult ? (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl">
                          {sendResult.processed}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Наград отправлено</p>
                          <p className="text-xs text-slate-500">Уведомления отправлены в Telegram</p>
                        </div>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {sendResult.results.map((r: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg text-sm">
                            <span className="font-medium text-slate-700">{r.name}</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${r.sentTg ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {r.sentTg ? 'Отправлено в TG' : (r.error || 'Нет TG')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                      <Award className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm">Здесь появятся результаты массовой рассылки</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              {!isEditingTemplate ? (
                <>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setEditingTemplateId(null);
                        setFormData({
                          name: '',
                          title: 'СЕРТИФИКАТ ВОЛОНТЕРА',
                          bodyText: 'Настоящим подтверждается, что {{name}} принял(а) активное участие в проекте "{{project}}" и внес(ла) вклад в размере {{hours}} часов.',
                          signature: 'Имя Фамилия (Должность)',
                          primaryColor: '#0ea5e9',
                          accentColor: '#0f172a'
                        });
                        setIsEditingTemplate(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Создать Шаблон
                    </button>
                  </div>

                  {templates.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                      <LayoutTemplate className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <h3 className="text-slate-900 font-bold mb-1">Нет шаблонов</h3>
                      <p className="text-slate-500 text-sm">Создайте первый шаблон для отправки наград</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templates.map(t => (
                        <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: t.primaryColor }} />
                          <h3 className="font-bold text-slate-900 mt-2 mb-1">{t.name}</h3>
                          <p className="text-xs text-slate-500 mb-4 font-mono truncate">{t.title}</p>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingTemplateId(t.id);
                                setFormData({
                                  name: t.name,
                                  title: t.title,
                                  bodyText: t.bodyText,
                                  signature: t.signature,
                                  primaryColor: t.primaryColor,
                                  accentColor: t.accentColor
                                });
                                setIsEditingTemplate(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              Редактировать
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(t.id)}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">
                      {editingTemplateId ? 'Редактировать шаблон' : 'Новый шаблон'}
                    </h2>
                    <button
                      onClick={() => setIsEditingTemplate(false)}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      Отмена
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Название шаблона (для вас)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Например: Сертификат за эко-проект"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Заголовок документа</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Текст документа</label>
                    <p className="text-xs text-slate-500 mb-2">Доступные переменные: {'{{name}}'}, {'{{project}}'}, {'{{hours}}'}, {'{{date}}'}</p>
                    <textarea
                      rows={5}
                      value={formData.bodyText}
                      onChange={e => setFormData({...formData, bodyText: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ФИО и Должность подписанта</label>
                    <input
                      type="text"
                      value={formData.signature}
                      onChange={e => setFormData({...formData, signature: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Основной цвет (HEX)</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                          className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={formData.primaryColor}
                          onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                          className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors uppercase font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Цвет акцента (HEX)</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.accentColor}
                          onChange={e => setFormData({...formData, accentColor: e.target.value})}
                          className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={formData.accentColor}
                          onChange={e => setFormData({...formData, accentColor: e.target.value})}
                          className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors uppercase font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                      onClick={() => setIsEditingTemplate(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSaveTemplate}
                      disabled={!formData.name}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                    >
                      Сохранить Шаблон
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
