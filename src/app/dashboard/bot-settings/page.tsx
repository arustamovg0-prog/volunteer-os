'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Settings, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Save, 
  ToggleLeft, 
  ToggleRight, 
  ShieldAlert,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { getPrivilegedHeaders } from '@/lib/client-security';

interface BotConfigResponse {
  bot_token?: string;
  webhook_url?: string;
  is_simulator_enabled: boolean;
  has_token: boolean;
}

interface WebhookInfoResponse {
  status?: string;
  ok?: boolean;
  result?: {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    last_error_date?: number;
    last_error_message?: string;
    max_connections?: number;
  };
  message?: string;
}

export default function BotSettingsPage() {
  const [role, setRole] = useState('manager');
  const [loading, setLoading] = useState(true);

  // Bot Config State
  const [tokenInput, setTokenInput] = useState('');
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [isSimEnabled, setIsSimEnabled] = useState(true);
  const [hasTokenSaved, setHasTokenSaved] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Webhook Live Info State
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfoResponse | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // UI Action Feedback State
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole');
    if (savedRole) setRole(savedRole);

    const handleRoleChange = () => {
      const updated = localStorage.getItem('currentUserRole');
      if (updated) setRole(updated);
    };

    window.addEventListener('auth-session-change', handleRoleChange);
    
    // Fetch initial configuration
    loadData();

    return () => window.removeEventListener('auth-session-change', handleRoleChange);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/telegram/config');
      if (res.ok) {
        const configData: BotConfigResponse = await res.json();
        setTokenInput(configData.bot_token || '');
        setWebhookUrlInput(configData.webhook_url || '');
        setIsSimEnabled(configData.is_simulator_enabled);
        setHasTokenSaved(configData.has_token);
      }
      
      // Load webhook info from Telegram
      await loadWebhookInfo();
    } catch (e) {
      console.error('Failed to load bot settings:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadWebhookInfo() {
    setLoadingInfo(true);
    try {
      const res = await fetch('/api/telegram/webhook/setup', {
        headers: getPrivilegedHeaders(),
      });
      if (res.ok) {
        const info: WebhookInfoResponse = await res.json();
        setWebhookInfo(info);
      } else {
        setWebhookInfo(null);
      }
    } catch (e) {
      console.error('Failed to load webhook info:', e);
      setWebhookInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') {
      alert('Ошибка доступа: Редактировать настройки бота может только Руководитель (Директор)');
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    setAlertMessage(null);

    try {
      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({
          bot_token: tokenInput,
          webhook_url: webhookUrlInput,
          is_simulator_enabled: isSimEnabled
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setHasTokenSaved(updated.has_token);
        setTokenInput(updated.bot_token || '');
        setAlertMessage('Настройки бота успешно сохранены!');
        setTimeout(() => setAlertMessage(null), 3000);
        
        // Dispatch custom event to let volunteer dashboard layout react instantly to simulator toggle
        window.dispatchEvent(new Event('bot-config-change'));
        
        // Refresh live info
        loadWebhookInfo();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Ошибка при сохранении настроек');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Сетевая ошибка при сохранении настроек');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWebhookAction = async (action: 'connect' | 'disconnect') => {
    if (role !== 'admin') {
      alert('Ошибка доступа: Управлять вебхуком бота может только Руководитель (Директор)');
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    setAlertMessage(null);

    try {
      const res = await fetch('/api/telegram/webhook/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({ action })
      });

      const data = await res.json();

      if (res.ok) {
        setAlertMessage(data.message);
        setTimeout(() => setAlertMessage(null), 4000);
        // Refresh info
        loadWebhookInfo();
      } else {
        setErrorMessage(data.error || 'Не удалось настроить вебхук в Telegram');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Сетевая ошибка при изменении статуса вебхука');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24 bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Determine actual webhook state
  const isWebhookConnected = webhookInfo?.ok && webhookInfo?.result?.url !== '';

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in pb-12">
      {/* Toast Feedbacks */}
      {alertMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{alertMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-red-900 border border-red-800 text-white text-xs shadow-lg flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-300" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-slate-900" />
            Интеграция с Telegram-ботом
          </h2>
          <p className="text-xs text-slate-500">
            Подключение бота, привязка вебхука и управление симулятором тестирования
          </p>
        </div>
      </div>

      {/* Role Warning for Coordinator */}
      {role !== 'admin' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-amber-600" />
          <span>
            Вы вошли как <strong>Координатор</strong>. Раздел доступен только в режиме чтения. Изменение токенов и перенастройка вебхуков в Telegram API ограничены (доступно только <strong>Директору</strong>).
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Form Settings (2/3 width) */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2.5 border-slate-100">
              <Settings className="w-4 h-4 text-slate-400" />
              Конфигурация интеграции
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-5">
              {/* 1. Bot Token */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Токен Telegram-бота (Bot Token)</label>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    от @BotFather
                    <span title="Получите токен у официального бота Telegram @BotFather">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    disabled={role !== 'admin'}
                    placeholder={hasTokenSaved ? '••••••••••••••••••••••••••••••••••••' : 'Вставьте токен вашего бота (HTTP API токен)'}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {hasTokenSaved && (
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Токен сохранен в системе. Для обновления сотрите поле и вставьте новый токен.
                  </p>
                )}
              </div>

              {/* 2. Webhook URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Базовый URL веб-приложения (Webhook URL)</label>
                </div>
                <input
                  type="url"
                  required
                  disabled={role !== 'admin'}
                  placeholder="https://volunteer-os.vercel.app"
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-400 font-mono"
                />
                <span className="text-[9px] text-slate-400 block leading-normal">
                  Telegram будет слать обновления на адрес: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[8px] text-slate-600">{webhookUrlInput ? `${webhookUrlInput.endsWith('/') ? webhookUrlInput : webhookUrlInput + '/'}api/telegram/webhook` : '.../api/telegram/webhook'}</code>. Обязательно используйте https-протокол.
                </span>
              </div>

              {/* 3. Simulator Toggle Switch */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-900 block">Симулятор в кабинете волонтера</label>
                  <span className="text-[10px] text-slate-400 block leading-normal">
                    Отображает интерактивное окно чата Telegram в правом углу для волонтеров. Отключите для продакшена.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={role !== 'admin'}
                  onClick={() => setIsSimEnabled(!isSimEnabled)}
                  className="text-slate-700 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isSimEnabled ? (
                    <ToggleRight className="w-10 h-10 text-slate-900" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Submit Save Button */}
              {role === 'admin' && (
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    {actionLoading ? 'Сохранение...' : 'Сохранить настройки'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Webhook Live info (1/3 width) */}
        <div className="space-y-6">
          <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Статус Webhook
              </h3>
              <button
                onClick={loadWebhookInfo}
                disabled={loadingInfo}
                className="p-1 text-slate-400 hover:text-slate-600 transition-all cursor-pointer disabled:opacity-40"
                title="Обновить информацию из Telegram API"
              >
                <RefreshCw className={`w-4 h-4 ${loadingInfo ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Telegram Webhook Status Box */}
            {webhookInfo?.status === 'not_configured' ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2 py-6">
                <AlertTriangle className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-800 font-bold">Бот не настроен</p>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Введите токен и сохраните конфигурацию, чтобы увидеть статус в Telegram API.
                </p>
              </div>
            ) : webhookInfo?.ok ? (
              <div className="space-y-4 text-xs">
                
                {/* Active Indicator badge */}
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isWebhookConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="font-bold text-slate-900">
                    {isWebhookConnected ? 'Подключен к Telegram API' : 'Вебхук отсутствует'}
                  </span>
                </div>

                {/* Info Fields */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-250 space-y-2.5 font-medium text-[10px] text-slate-700">
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Зарегистрированный URL</span>
                    <span className="font-mono block truncate text-slate-900" title={webhookInfo.result?.url}>
                      {webhookInfo.result?.url || '— (не подключен)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Ожидает обновлений в очереди</span>
                    <span className="font-bold text-slate-950 block">{webhookInfo.result?.pending_update_count ?? 0} сообщений</span>
                  </div>
                  {webhookInfo.result?.last_error_message && (
                    <div className="border-t pt-2 mt-1 border-slate-200">
                      <span className="text-[9px] text-rose-500 block font-bold uppercase">Последняя ошибка доставки</span>
                      <p className="text-rose-700 leading-normal text-[9px] whitespace-pre-wrap font-mono mt-0.5">
                        {webhookInfo.result.last_error_message}
                      </p>
                      {webhookInfo.result.last_error_date && (
                        <span className="text-[8px] text-slate-400 block mt-0.5">
                          Когда: {new Date(webhookInfo.result.last_error_date * 1000).toLocaleString('ru-RU')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {role === 'admin' && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {isWebhookConnected ? (
                      <button
                        onClick={() => handleWebhookAction('disconnect')}
                        disabled={actionLoading}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-xl transition-all cursor-pointer text-[10px]"
                      >
                        Отключить Webhook
                      </button>
                    ) : (
                      <button
                        onClick={() => handleWebhookAction('connect')}
                        disabled={actionLoading || !webhookUrlInput}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer text-[10px] flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Активировать Webhook
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-2 py-5">
                <AlertTriangle className="w-6 h-6 text-red-500 mx-auto" />
                <p className="text-xs text-red-800 font-bold">Ошибка авторизации</p>
                <p className="text-[10px] text-red-650 leading-normal">
                  Telegram API вернул ошибку. Проверьте правильность токена бота.
                </p>
              </div>
            )}
          </div>

          {/* Quick instructions box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 space-y-2 leading-relaxed">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider">Инструкция по подключению</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Получите токен вашего бота у <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold inline-flex items-center gap-0.5 hover:underline">@BotFather <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
              <li>Разверните Volunteer OS на публичном адресе с поддержкой HTTPS.</li>
              <li>Введите базовый URL и токен слева и нажмите <strong>«Сохранить настройки»</strong>.</li>
              <li>Нажмите кнопку <strong>«Активировать Webhook»</strong> на этой панели.</li>
              <li>Протестируйте бота, написав ему в Telegram команду <code className="bg-slate-200 px-1 rounded font-semibold text-slate-700">/start</code>!</li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
}
