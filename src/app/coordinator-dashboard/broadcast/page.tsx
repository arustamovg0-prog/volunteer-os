'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Send, FolderGit2, AlertCircle, CheckCircle2, Paperclip, Users } from 'lucide-react';

interface Project {
  id: string;
  title: string;
}

export default function CoordinatorBroadcastPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'project' | 'senior'>('project');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects/coordinator', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const projs: Project[] = data.projects || [];
        setProjects(projs);
        if (projs.length > 0) setSelectedProjectId(projs[0].id);
      }
    } catch (e) {
      console.error('Failed to load coordinator projects:', e);
    }
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !title) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('targetAudience', targetAudience);
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch(`/api/projects/${selectedProjectId}/rsvp-invite`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`Рассылка успешно отправлена! Получателей: ${data.recipientsCount || 0}`);
        setTitle('');
        setDescription('');
        setFile(null);
      } else {
        setErrorMsg(data.error || 'Ошибка при отправке рассылки');
      }
    } catch (e) {
      console.error('Broadcast send error:', e);
      setErrorMsg('Ошибка сети при отправке рассылки');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Рассылка приглашений (RSVP)</h1>
        <p className="text-sm text-slate-500">Массовая отправка RSVP-приглашений и файлов волонтерам в Telegram</p>
      </div>

      {/* Form Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSendBroadcast} className="space-y-5">
          {/* Select Project */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Проект для рассылки</label>
            <select
              required
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {projects.length === 0 ? (
                <option value="">Нет доступных проектов</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))
              )}
            </select>
          </div>

          {/* Select Audience */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Целевая аудитория</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetAudience('project')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  targetAudience === 'project'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <FolderGit2 className="w-4 h-4" />
                В проекте
              </button>
              <button
                type="button"
                onClick={() => setTargetAudience('senior')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  targetAudience === 'senior'
                    ? 'border-amber-500 bg-amber-50/60 text-amber-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>⭐</span>
                Старшие волонтеры
              </button>
              <button
                type="button"
                onClick={() => setTargetAudience('all')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  targetAudience === 'all'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Users className="w-4 h-4" />
                Все волонтеры
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Заголовок приглашения</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Набор волонтеров на утреннюю смену"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Текст сообщения</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание задачи, времени и места сбора..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Прикрепить файл (JPEG, PNG, PDF, MP4, DOC, EXCEL, PPTX)</label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors">
                <Paperclip className="w-4 h-4 text-slate-400" />
                {file ? file.name : 'Выбрать файл'}
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-red-600 hover:underline font-bold"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || projects.length === 0}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Отправка рассылки...' : 'Отправить рассылку в Telegram'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
