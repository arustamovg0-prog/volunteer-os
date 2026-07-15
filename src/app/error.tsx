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
    // Log the error to our custom monitoring panel API
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level: 'ERROR',
        message: `Unhandled Client Error: ${error.message}`,
        details: {
          stack: error.stack,
          digest: error.digest,
        },
        source: 'client',
      }),
    }).catch(console.error); // Silently catch if the logging itself fails
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 shadow-xl text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Что-то пошло не так</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Произошла непредвиденная ошибка. Мы уже получили уведомление и работаем над ее устранением.
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow transition-all duration-200 active:scale-95"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
