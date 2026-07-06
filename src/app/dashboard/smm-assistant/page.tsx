'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Calendar, 
  Clock, 
  Check, 
  Megaphone,
  Loader2,
  FileText
} from 'lucide-react';

export default function SmmAssistantPage() {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Экология');
  const [tone, setTone] = useState('inspiring');
  const [generating, setGenerating] = useState(false);
  
  // Output state
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert('Пожалуйста, введите название и описание мероприятия');
      return;
    }

    setGenerating(true);
    setCopied(false);
    try {
      const res = await fetch('/api/smm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          tone
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedDraft(data.draft);
        setSuggestedTime(data.suggested_time);
      } else {
        alert('Ошибка при генерации поста');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-slate-850 animate-pulse" />
          ИИ SMM-Ассистент
        </h1>
        <p className="text-xs text-slate-500">Автоматическая генерация постов для соцсетей по шаблону мероприятия и календарное планирование</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-slate-400" />
              Параметры анонса
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Название мероприятия *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Чистый берег Волги"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 bg-white"
                  >
                    <option value="Экология">Экология</option>
                    <option value="Защита животных">Защита животных</option>
                    <option value="Социальная помощь">Социальная помощь</option>
                    <option value="Здравоохранение">Здравоохранение</option>
                    <option value="Образование">Образование</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Тональность поста</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 bg-white"
                  >
                    <option value="inspiring">Вдохновляющий</option>
                    <option value="official">Официальный</option>
                    <option value="emotional">Эмоциональный</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Основные детали мероприятия *</label>
                <textarea
                  required
                  placeholder="Сбор в субботу у входа в парк в 10:00. Будем убирать мусор, красить лавочки, сажать цветы. Всем участникам выдадим футболки, перчатки и легкий перекус."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {generating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Сгенерировать пост
              </button>
            </form>
          </div>

          {/* Recommended Calendar Slots */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Календарное планирование (ИИ-слоты)
            </h2>
            
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-800">Понедельник (Утро)</p>
                    <p className="text-[10px] text-slate-400">Лучшее время для анонса на неделю</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">09:30</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-800">Четверг (Обед)</p>
                    <p className="text-[10px] text-slate-400">Напоминание о выходных субботниках</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">13:15</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-800">Воскресенье (Вечер)</p>
                    <p className="text-[10px] text-slate-400">Итоговый отчет с фотографиями</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">18:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7">
          {generatedDraft ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Рекомендуемое время публикации: <span className="text-slate-800 font-bold">{suggestedTime}</span>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Скопировано!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Скопировать текст
                    </>
                  )}
                </button>
              </div>

              {/* Draft Box */}
              <div className="bg-slate-950 text-slate-200 rounded-xl p-6 shadow-md font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800 min-h-[400px]">
                {generatedDraft}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center flex flex-col justify-center items-center h-full min-h-[450px]">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-xs font-semibold text-slate-500">Черновик публикации отсутствует</p>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1">Заполните левую форму и нажмите кнопку генерации, чтобы получить ИИ-шаблон поста для Telegram канала.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
