'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, 
  X, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  FileSpreadsheet, 
  Presentation, 
  File as GenericFileIcon,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description?: string | null;
  end_date?: string | null;
}

interface RsvpModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RsvpModal({ isOpen, project, onClose, onSuccess }: RsvpModalProps) {
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpIncludeButtons, setRsvpIncludeButtons] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'all' | 'project' | 'organization' | 'senior'>('all');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project) {
      setRsvpIncludeButtons(false);
      setTargetAudience('all');
      setAttachedFile(null);
      setPreviewUrl(null);
      setErrorMsg(null);
      
      const dateFormatted = project.end_date ? new Date(project.end_date).toLocaleDateString('ru-RU') : '';
      setRsvpMessage(
`Assalomu alaykum, aziz volontyor! 🩺

🎉 Sizni "${project.title}" loyihasida ko‘rishdan mamnun bo‘lamiz!

${project.description || ''}
${dateFormatted ? `\n📅 Sana: ${dateFormatted}` : ''}

Iltimos, ushbu botdagi xabarlarni kuzatib boring.

───────────────────────────

Здравствуйте, дорогой волонтёр! 🩺

🎉 Будем рады видеть вас среди участников проекта "${project.title}"!

${project.description || ''}
${dateFormatted ? `\n📅 Дата: ${dateFormatted}` : ''}

Пожалуйста, следите за сообщениями в данном боте.`
      );
    }
  }, [project]);

  // Handle image preview URL cleanup
  useEffect(() => {
    if (attachedFile && attachedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(attachedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [attachedFile]);

  if (!isOpen || !project) return null;

  function handleFileSelect(file: File | null) {
    setErrorMsg(null);
    if (!file) {
      setAttachedFile(null);
      return;
    }

    // 50MB File Limit
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('Размер файла превышает лимит 50 МБ.');
      return;
    }

    setAttachedFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function getFileIcon(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const type = file.type;

    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    if (type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    if (ext === 'pdf') {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return <Presentation className="w-5 h-5 text-amber-500" />;
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return <FileText className="w-5 h-5 text-sky-500" />;
    }
    return <GenericFileIcon className="w-5 h-5 text-slate-500" />;
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;

    setIsSending(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('customText', rsvpMessage);
      formData.append('includeButtons', rsvpIncludeButtons ? 'true' : 'false');
      formData.append('targetAudience', targetAudience);
      
      if (attachedFile) {
        formData.append('file', attachedFile);
      }

      const res = await fetch(`/api/projects/${project.id}/rsvp-invite`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert(`🎉 Приглашения успешно отправлены! (Доставлено: ${data.count} из ${data.total})`);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(data.error || 'Ошибка при отправке рассылки');
      }
    } catch (e) {
      console.error('RSVP submission error:', e);
      setErrorMsg('Ошибка подключения к серверу');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shadow-2xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950">Рассылка приглашения (RSVP)</h2>
              <p className="text-xs text-slate-500 font-medium">
                Проект: <span className="font-semibold text-slate-800">{project.title}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target Audience Segment Selection */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Кому отправить рассылку? (Целевая аудитория)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTargetAudience('all')}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                  targetAudience === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-bold flex items-center gap-1">🌐 Всем</span>
                <span className={`text-[10px] ${targetAudience === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>Все волонтеры</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('project')}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                  targetAudience === 'project'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-bold flex items-center gap-1">📌 В проекте</span>
                <span className={`text-[10px] ${targetAudience === 'project' ? 'text-slate-300' : 'text-slate-400'}`}>Состоят в проекте</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('organization')}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                  targetAudience === 'organization'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-bold flex items-center gap-1">🏢 Из органиизации</span>
                <span className={`text-[10px] ${targetAudience === 'organization' ? 'text-slate-300' : 'text-slate-400'}`}>В организации</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('senior')}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                  targetAudience === 'senior'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span className="font-bold flex items-center gap-1">⭐ Старшие</span>
                <span className={`text-[10px] ${targetAudience === 'senior' ? 'text-amber-100' : 'text-amber-700'}`}>Старшие волонтеры</span>
              </button>
            </div>
          </div>

          {/* Custom Message Text */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Текст сообщения для рассылки в Telegram-бот
            </label>
            <textarea
              value={rsvpMessage}
              onChange={(e) => setRsvpMessage(e.target.value)}
              rows={7}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-sans focus:ring-2 focus:ring-amber-500 focus:border-amber-500 leading-relaxed text-slate-800 bg-slate-50/50"
              placeholder="Введите текст приглашения..."
              required
            />
            <p className="text-[11px] text-slate-400">
              Вы можете свободно изменить текст перед отправкой.
            </p>
          </div>

          {/* File Attachment Section */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                Прикрепить файл к рассылке
              </span>
              <span className="text-[10px] text-slate-400 normal-case font-medium">
                (JPEG, PNG, PDF, MP4, DOCS, EXCEL, PPTX и др.)
              </span>
            </label>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
              accept="*/*"
            />

            {!attachedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-amber-500 bg-amber-50/50' 
                    : 'border-slate-200 hover:border-slate-350 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-700">Нажмите для выбора файла</span>
                    <span className="text-xs text-slate-500"> или перетащите его сюда</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Поддерживаются любые типы файлов до 50 МБ
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {getFileIcon(attachedFile)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={attachedFile.name}>
                      {attachedFile.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span className="uppercase font-bold tracking-wider px-1.5 py-0.2 bg-white rounded border border-slate-200">
                        {attachedFile.name.split('.').pop() || 'file'}
                      </span>
                      <span>{formatFileSize(attachedFile.size)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleFileSelect(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all shrink-0"
                  title="Удалить прикрепленный файл"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Answer Buttons Checkbox */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="includeButtonsToggle"
              checked={rsvpIncludeButtons}
              onChange={(e) => setRsvpIncludeButtons(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="includeButtonsToggle" className="cursor-pointer space-y-0.5">
              <span className="text-xs font-bold text-amber-950 block">
                Добавить кнопки ответа (✅ Да, буду участвовать / ❌ Не смогу)
              </span>
              <span className="text-[11px] text-amber-800/80 block leading-normal">
                Если галочка снята, волонтеры получат только текстовое приглашение без кнопок выбора.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSending || !rsvpMessage.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Megaphone className="w-4 h-4" />
              {isSending ? 'Отправка...' : 'Отправить рассылку волонтерам'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
