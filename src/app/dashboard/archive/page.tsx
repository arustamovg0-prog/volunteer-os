'use client';

import { useState, useEffect } from 'react';
import { 
  Archive, 
  Trash2, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  File, 
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ArchiveItem {
  id: string;
  chat_title: string;
  file_name: string;
  file_type: 'image' | 'document' | 'audio' | 'video';
  file_size: number; // in KB
  file_url: string;
  extracted_at: string;
}

export default function ArchivePage() {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/archive');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Удалить этот файл из архива?')) return;
    try {
      const res = await fetch(`/api/archive?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadItem = (item: ArchiveItem) => {
    if (!item.file_url) {
      setCleanupResult(`У файла "${item.file_name}" нет ссылки для скачивания.`);
      return;
    }

    const link = document.createElement('a');
    link.href = item.file_url;
    link.download = item.file_name;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCleanEmptyChats = async () => {
    setCleaning(true);
    setCleanupResult(null);
    try {
      const res = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      });
      if (res.ok) {
        const result = await res.json();
        setCleanupResult(result.message);
        // Refresh items just in case
        fetchItems();
      } else {
        alert('Ошибка при очистке чатов');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCleaning(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'video': return <Video className="w-5 h-5 text-purple-500" />;
      case 'document': return <FileText className="w-5 h-5 text-emerald-500" />;
      default: return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatSize = (kb: number) => {
    if (kb > 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${kb} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-800" />
            Цифровой Архив & Сжатие Чатов
          </h1>
          <p className="text-xs text-slate-500">Автоматически извлеченные медиафайлы и система удаления неактивных ресурсов</p>
        </div>

        <button
          onClick={handleCleanEmptyChats}
          disabled={cleaning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs transition-all shadow-sm"
        >
          {cleaning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Удалить пустые чаты (Сжатие)
        </button>
      </div>

      {/* Cleanup Result Notification */}
      {cleanupResult && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center gap-3 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-semibold">
            {cleanupResult}
          </div>
          <button 
            onClick={() => setCleanupResult(null)} 
            className="ml-auto text-emerald-600 hover:text-emerald-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Description card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex gap-3 text-xs text-slate-600 leading-relaxed">
        <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800">Как работает цифровой архив:</p>
          <p className="mt-1">
            Наш Telegram-бот автоматически парсит все рабочие группы. Фотографии, видео и отчетные документы извлекаются в эту панель,
            позволяя руководству просматривать файлы без необходимости листать сотни переписок.
            Функция <strong>"Удалить пустые чаты"</strong> сканирует все 1000+ рабочих чатов и автоматически удаляет комнаты с 0 сообщений, экономя лимиты платформы.
          </p>
        </div>
      </div>

      {/* Main Files Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Загрузка цифрового архива...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
          <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700">В цифровом архиве пока нет файлов</p>
          <p className="text-[11px] text-slate-400 mt-1">Отправьте файл в Telegram-бот или прикрепите к отчету, чтобы он отобразился здесь.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Тип</th>
                  <th className="py-3 px-5">Имя файла</th>
                  <th className="py-3 px-5">Источник (Чат)</th>
                  <th className="py-3 px-5">Размер</th>
                  <th className="py-3 px-5">Дата извлечения</th>
                  <th className="py-3 px-5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                        {getIcon(item.file_type)}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {item.file_name}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {item.chat_title}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono">
                      {formatSize(item.file_size)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {new Date(item.extracted_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1.5">
                      <button
                        onClick={() => handleDownloadItem(item)}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
                        title="Скачать"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 hover:text-red-800 transition-colors"
                        title="Удалить из архива"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
