'use client';

interface FetchErrorProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
}

export default function FetchError({
  title = 'Unable to load data',
  message = 'Check your internet connection and try again.',
  onRetry,
  retrying = false,
}: FetchErrorProps) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-danger/5 flex items-center justify-center">
        <svg className="w-10 h-10 text-danger/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-secondary mb-6">{message}</p>
      <button
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex items-center gap-2 px-6 py-3 gradient-primary text-white
          text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {retrying ? 'Retrying…' : 'Try Again'}
      </button>
    </div>
  );
}
