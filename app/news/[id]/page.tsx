'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface NewsArticle {
  id: string;
  date: string;
  tag: string;
  title: string;
  excerpt: string;
  body: string | null;
  image_url: string | null;
  published: boolean;
  created_at: string;
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    supabase
      .from('news_articles')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setArticle(data);
          // Load related articles (same tag, exclude this one)
          supabase
            .from('news_articles')
            .select('*')
            .eq('published', true)
            .eq('tag', data.tag)
            .neq('id', id)
            .limit(3)
            .then(({ data: rel }) => setRelated(rel || []));
        }
        setLoading(false);
      });
  }, [id]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse-soft space-y-6">
            <div className="h-4 bg-border/40 rounded w-24" />
            <div className="h-72 bg-border/30 rounded-2xl" />
            <div className="h-6 bg-border/40 rounded w-2/3" />
            <div className="h-4 bg-border/30 rounded w-full" />
            <div className="h-4 bg-border/30 rounded w-5/6" />
            <div className="h-4 bg-border/30 rounded w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-6xl">📰</p>
        <h1 className="text-2xl font-bold text-text">Article Not Found</h1>
        <p className="text-text-secondary max-w-sm">
          This article may have been removed or the link is incorrect.
        </p>
        <Link href="/"
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero image ── */}
      <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-hero flex items-center justify-center">
            <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      {/* ── Article body ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-20">

        {/* Back link */}
        <Link href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Card wrapper */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-8 sm:p-10">

          {/* Tag + date */}
          <div className="flex items-center gap-3 mb-5">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              {article.tag}
            </span>
            <span className="text-xs text-text-secondary">{article.date}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text leading-tight mb-5">
            {article.title}
          </h1>

          {/* Divider */}
          <div className="h-px bg-border mb-7" />

          {/* If body exists: show excerpt as intro quote + body as full text.
              If no body: show excerpt as the full readable content. */}
          {article.body ? (
            <>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6 italic border-l-4 border-primary/30 pl-4">
                {article.excerpt}
              </p>
              <div
                className="text-text leading-relaxed space-y-4"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {article.body}
              </div>
            </>
          ) : (
            <p className="text-base text-text leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
              {article.excerpt}
            </p>
          )}
        </div>

        {/* ── Related articles ── */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-text mb-6">More in <span className="text-primary">{article.tag}</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((rel) => (
                <Link key={rel.id} href={`/news/${rel.id}`}
                  className="group bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="h-28 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                    {rel.image_url
                      ? <img src={rel.image_url} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      : <div className="w-full h-full gradient-hero flex items-center justify-center">
                          <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                        </div>
                    }
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <span className="text-xs text-primary font-semibold mb-1">{rel.tag}</span>
                    <p className="text-sm font-bold text-text leading-snug line-clamp-2 flex-1">{rel.title}</p>
                    <p className="text-xs text-text-secondary mt-2">{rel.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
