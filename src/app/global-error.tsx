'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level: 'ERROR',
        message: `FATAL Global Error: ${error.message}`,
        details: {
          stack: error.stack,
          digest: error.digest,
        },
        source: 'client',
      }),
    }).catch(console.error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <span className="text-2xl font-bold">!</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Критический сбой</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Произошла фатальная ошибка на уровне приложения. Администратор платформы уже получил уведомление.
              </p>
            </div>

            <button
              onClick={() => reset()}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow transition-all duration-200 active:scale-95"
            >
              Перезагрузить приложение
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
