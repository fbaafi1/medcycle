import { createServerSupabase } from '@/lib/supabase-server';
import HomePageClient from '@/components/HomePageClient';

export const revalidate = 60;

export default async function HomePage() {
  let initialNews: Awaited<ReturnType<typeof fetchNews>> = [];
  let initialGallery: Awaited<ReturnType<typeof fetchGallery>> = [];
  let serverFetchFailed = false;

  try {
    const supabase = createServerSupabase();
    const [news, gallery] = await Promise.all([
      fetchNews(supabase),
      fetchGallery(supabase),
    ]);
    initialNews = news;
    initialGallery = gallery;
  } catch {
    serverFetchFailed = true;
  }

  return (
    <HomePageClient
      initialNews={initialNews}
      initialGallery={initialGallery}
      serverFetchFailed={serverFetchFailed}
    />
  );
}

async function fetchNews(supabase: ReturnType<typeof createServerSupabase>) {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(4);
  if (error) throw error;
  return data ?? [];
}

async function fetchGallery(supabase: ReturnType<typeof createServerSupabase>) {
  const { data, error } = await supabase
    .from('donation_gallery')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);
  if (error) throw error;
  return data ?? [];
}
