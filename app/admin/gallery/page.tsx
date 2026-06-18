'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GalleryItem {
  id: string;
  label: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

const BLANK = { label:'', description:'', image_url: null as string|null };

export default function AdminGalleryPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>([]);
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
      supabase.from('donation_gallery').select('*').order('created_at',{ascending:false})
        .then(({data}) => { setItems(data||[]); setLoading(false); });
    }
  }, [authLoading, user, profile]);

  const openNew = () => {
    setEditingId(null); setForm(BLANK); setImageFile(null); setImagePreview(null); setError(''); setFormOpen(true);
  };
  const openEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setForm({ label:item.label, description:item.description, image_url:item.image_url });
    setImageFile(null); setImagePreview(item.image_url); setError(''); setFormOpen(true);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setImageFile(f);
    const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(f);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()||!form.description.trim()) { setError('Label and description are required.'); return; }
    setSaving(true); setError('');
    try {
      let image_url = form.image_url;
      if (imageFile && user) {
        const ext = imageFile.name.split('.').pop();
        const path = `gallery/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('content-images').upload(path, imageFile);
        if (upErr) throw upErr;
        image_url = supabase.storage.from('content-images').getPublicUrl(path).data.publicUrl;
      }
      const payload = { ...form, image_url };
      if (editingId) {
        const { error } = await supabase.from('donation_gallery').update(payload).eq('id', editingId);
        if (error) throw error;
        setItems(prev => prev.map(x => x.id===editingId ? {...x,...payload} : x));
      } else {
        const { data, error } = await supabase.from('donation_gallery').insert(payload).select().single();
        if (error) throw error;
        setItems(prev => [data,...prev]);
      }
      setFormOpen(false);
    } catch(err:any) { setError(err.message||'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this story?')) return;
    const { error } = await supabase.from('donation_gallery').delete().eq('id', id);
    if (error) { alert('Failed to delete: ' + error.message); return; }
    setItems(prev => prev.filter(x => x.id !== id));
  };

  if (authLoading||!profile?.is_admin) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-border/40 transition-colors">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text">Donation Gallery</h1>
          <p className="text-sm text-text-secondary">Manage stories shown in the homepage gallery section.</p>
        </div>
        <button onClick={openNew} className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 gradient-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 shadow-md">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Story
        </button>
      </div>

      {/* Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 animate-slide-up my-4">
            <h2 className="text-lg font-bold text-text mb-5">{editingId?'Edit Story':'Add Donation Story'}</h2>
            {error && <p className="mb-4 text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
            <form onSubmit={handleSave} className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Photo *</label>
                {imagePreview ? (
                  <div className="relative mb-2 rounded-xl overflow-hidden border border-border h-48">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover"/>
                    <button type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); setForm(f=>({...f,image_url:null})); if(fileRef.current) fileRef.current.value=''; }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 text-xs">✕</button>
                  </div>
                ) : (
                  <div onClick={() => fileRef.current?.click()}
                    className="h-48 mb-2 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <svg className="w-10 h-10 text-text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p className="text-sm text-text-secondary font-medium">Click to upload photo</p>
                    <p className="text-xs text-text-secondary/60">JPG, PNG, WebP — recommended 800×600</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Location / Label *</label>
                <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. Pediatric Clinic – Kano"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Description *</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="What was donated and to whom?"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setFormOpen(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-text-secondary bg-background border border-border rounded-xl hover:bg-border/40 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold text-white gradient-primary rounded-xl hover:opacity-90 disabled:opacity-50 shadow-md">
                  {saving?'Saving…':editingId?'Save Changes':'Add Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_,i)=>(
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse-soft">
              <div className="h-44 bg-border/30"/>
              <div className="p-4 bg-white border border-border border-t-0 space-y-2">
                <div className="h-4 bg-border/30 rounded w-2/3"/>
                <div className="h-3 bg-border/30 rounded w-full"/>
              </div>
            </div>
          ))}
        </div>
      ) : items.length===0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="font-semibold text-text mb-1">No gallery stories yet</p>
          <p className="text-sm text-text-secondary">Click "Add Story" to upload your first donation photo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item=>(
            <div key={item.id} className="rounded-2xl overflow-hidden shadow-sm border border-border bg-white">
              {item.image_url ? (
                <img src={item.image_url} alt={item.label} className="w-full h-44 object-cover"/>
              ) : (
                <div className="w-full h-44 bg-border/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/>
                  </svg>
                </div>
              )}
              <div className="p-4">
                <p className="font-bold text-text text-sm mb-1">{item.label}</p>
                <p className="text-text-secondary text-xs leading-relaxed line-clamp-2 mb-4">{item.description}</p>
                <div className="flex gap-2">
                  <button onClick={()=>openEdit(item)} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors">Edit</button>
                  <button onClick={()=>handleDelete(item.id)} className="flex-1 py-1.5 text-xs font-semibold rounded-lg text-danger hover:bg-danger/5 border border-danger/20 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
