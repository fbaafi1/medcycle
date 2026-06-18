'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NewsArticle {
  id: string;
  date: string;
  tag: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  published: boolean;
  created_at: string;
}

const BLANK: { title:string;excerpt:string;tag:string;date:string;image_url:string|null;published:boolean } =
  { title:'', excerpt:'', tag:'', date: new Date().toISOString().slice(0,10), image_url:null, published:true };

export default function AdminNewsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File|null>(null);
  const [imagePreview, setImagePreview] = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !profile?.is_admin) { router.push('/'); return; }
      supabase.from('news_articles').select('*').order('created_at',{ascending:false})
        .then(({data}) => { setArticles(data||[]); setLoading(false); });
    }
  }, [authLoading, user, profile]);

  const openNew = () => {
    setEditingId(null); setForm(BLANK); setImageFile(null); setImagePreview(null); setError(''); setFormOpen(true);
  };
  const openEdit = (a: NewsArticle) => {
    setEditingId(a.id);
    setForm({title:a.title,excerpt:a.excerpt,tag:a.tag,date:a.date,image_url:a.image_url,published:a.published});
    setImageFile(null); setImagePreview(a.image_url); setError(''); setFormOpen(true);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setImageFile(f);
    const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(f);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()||!form.excerpt.trim()||!form.date) { setError('Title, excerpt and date are required.'); return; }
    setSaving(true); setError('');
    try {
      let image_url = form.image_url;
      if (imageFile && user) {
        const ext = imageFile.name.split('.').pop();
        const path = `news/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('content-images').upload(path, imageFile);
        if (upErr) throw upErr;
        image_url = supabase.storage.from('content-images').getPublicUrl(path).data.publicUrl;
      }
      const payload = { ...form, image_url };
      if (editingId) {
        const { error } = await supabase.from('news_articles').update(payload).eq('id', editingId);
        if (error) throw error;
        setArticles(prev => prev.map(a => a.id===editingId ? {...a,...payload} : a));
      } else {
        const { data, error } = await supabase.from('news_articles').insert(payload).select().single();
        if (error) throw error;
        setArticles(prev => [data,...prev]);
      }
      setFormOpen(false);
    } catch(err:any) { setError(err.message||'Failed to save.'); }
    finally { setSaving(false); }
  };

  const togglePublish = async (a: NewsArticle) => {
    const { error } = await supabase
      .from('news_articles')
      .update({ published: !a.published })
      .eq('id', a.id);
    if (error) { alert('Failed to update: ' + error.message); return; }
    setArticles(prev => prev.map(x => x.id === a.id ? { ...x, published: !a.published } : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    const { error } = await supabase.from('news_articles').delete().eq('id', id);
    if (error) { alert('Failed to delete: ' + error.message); return; }
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  if (authLoading||!profile?.is_admin) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-border/40 transition-colors">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text">News Articles</h1>
          <p className="text-sm text-text-secondary">Manage homepage news articles.</p>
        </div>
        <button onClick={openNew} className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 gradient-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 shadow-md">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          New Article
        </button>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 animate-slide-up my-4">
            <h2 className="text-lg font-bold text-text mb-5">{editingId?'Edit Article':'New Article'}</h2>
            {error && <p className="mb-4 text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
            <form onSubmit={handleSave} className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Cover Image</label>
                {imagePreview ? (
                  <div className="relative mb-2 rounded-xl overflow-hidden border border-border h-40">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover"/>
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setForm(f=>({...f,image_url:null})); if(fileRef.current) fileRef.current.value=''; }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 text-xs">✕</button>
                  </div>
                ) : (
                  <div onClick={() => fileRef.current?.click()}
                    className="h-40 mb-2 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <svg className="w-8 h-8 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p className="text-sm text-text-secondary">Click to upload image</p>
                    <p className="text-xs text-text-secondary/60">JPG, PNG, WebP</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Title *</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Article headline"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Excerpt *</label>
                <textarea value={form.excerpt} onChange={e=>setForm(f=>({...f,excerpt:e.target.value}))} rows={3}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" placeholder="Short summary shown on homepage"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Tag *</label>
                  <input value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Impact"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"/>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div onClick={()=>setForm(f=>({...f,published:!f.published}))}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.published?'bg-emerald-500':'bg-border'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.published?'translate-x-5':''}`}/>
                </div>
                <span className="text-sm font-medium text-text">Published</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setFormOpen(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-text-secondary bg-background border border-border rounded-xl hover:bg-border/40 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold text-white gradient-primary rounded-xl hover:opacity-90 disabled:opacity-50 shadow-md">
                  {saving?'Saving…':editingId?'Save Changes':'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse-soft"/>)}</div>
      ) : articles.length===0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <p className="text-4xl mb-3">📰</p>
          <p className="font-semibold text-text mb-1">No articles yet</p>
          <p className="text-sm text-text-secondary">Click "New Article" to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-background/50">
              <th className="text-left px-4 py-3 font-semibold text-text-secondary whitespace-nowrap">Article</th>
              <th className="text-left px-4 py-3 font-semibold text-text-secondary whitespace-nowrap">Tag</th>
              <th className="text-left px-4 py-3 font-semibold text-text-secondary whitespace-nowrap">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-text-secondary whitespace-nowrap">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-text-secondary whitespace-nowrap">Actions</th>
            </tr></thead>
            <tbody>
              {articles.map(a=>(
                <tr key={a.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {a.image_url
                        ? <img src={a.image_url} alt={a.title} className="w-12 h-10 rounded-lg object-cover shrink-0 border border-border"/>
                        : <div className="w-12 h-10 rounded-lg bg-border/30 shrink-0 flex items-center justify-center">
                            <svg className="w-5 h-5 text-text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/></svg>
                          </div>}
                      <span className="font-medium text-text line-clamp-1 min-w-[120px]">{a.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">{a.tag}</span></td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{a.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {a.published
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Published</span>
                      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-border/50 text-text-secondary"><span className="w-1.5 h-1.5 rounded-full bg-text-secondary/40"/>Draft</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <button onClick={()=>togglePublish(a)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-colors">
                        {a.published?'Unpublish':'Publish'}
                      </button>
                      <button onClick={()=>openEdit(a)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors">Edit</button>
                      <button onClick={()=>handleDelete(a.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-danger hover:bg-danger/5 border border-danger/20 transition-colors">Delete</button>
                    </div>
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
