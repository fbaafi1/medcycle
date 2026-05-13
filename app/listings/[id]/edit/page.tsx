'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Listing, ListingCategory, EquipmentCondition } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';

export default function EditListingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const [listing, setListing] = useState<Listing | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>('medication');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [genericName, setGenericName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [condition, setCondition] = useState<EquipmentCondition>('new');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    const fetchListing = async () => {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (!data || (user && data.user_id !== user.id)) {
        router.push('/my-listings');
        return;
      }

      setListing(data);
      setTitle(data.title);
      setDescription(data.description);
      setCategory(data.category);
      setImagePreview(data.image_url);
      setGenericName(data.generic_name || '');
      setTradeName(data.trade_name || '');
      setExpiryDate(data.expiry_date || '');
      setCondition(data.condition || 'new');
      setQuantity(data.quantity?.toString() || '');
      setPageLoading(false);
    };

    if (user && id) fetchListing();
  }, [authLoading, user, id, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listing) return;

    setSaving(true);
    setError('');

    try {
      let imageUrl = listing.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('listing-images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const updateData = {
        title,
        description,
        category,
        image_url: imageUrl,
        generic_name: category === 'medication' ? genericName || null : null,
        trade_name: category === 'medication' ? tradeName || null : null,
        expiry_date: category === 'medication' ? expiryDate || null : null,
        condition: category === 'equipment' ? condition : null,
        quantity: category === 'supply' ? parseInt(quantity) || null : null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listing.id);

      if (updateError) throw updateError;
      router.push(`/listings/${listing.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update listing');
      setSaving(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse-soft space-y-4">
          <div className="h-8 bg-border/30 rounded w-1/3" />
          <div className="h-96 bg-border/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Edit Listing</h1>
        <p className="text-sm text-text-secondary mt-1">Update your listing details.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm animate-fade-in">
        {error && (
          <div className="mb-4 p-3 bg-danger/5 border border-danger/20 rounded-lg text-sm text-danger">{error}</div>
        )}

        <div className="space-y-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'medication', label: 'Medication' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'supply', label: 'Supply' },
              ] as const).map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`py-3 px-3 text-sm font-medium rounded-xl border-2 transition-all ${
                    category === cat.value
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-border bg-white text-text-secondary hover:border-primary/30'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Image</label>
            {imagePreview && (
              <div className="mb-3 relative rounded-xl overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">✕</button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange}
              className="w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/5 file:text-primary hover:file:bg-primary/10 cursor-pointer" />
          </div>

          {category === 'medication' && (
            <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900">Medication Details</h3>
              <input type="text" value={genericName} onChange={(e) => setGenericName(e.target.value)} placeholder="Generic Name"
                className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <input type="text" value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="Trade Name"
                className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          )}

          {category === 'equipment' && (
            <div className="space-y-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <h3 className="text-sm font-semibold text-emerald-900">Equipment Details</h3>
              <select value={condition} onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
                className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="needs_repair">Needs Repair</option>
              </select>
            </div>
          )}

          {category === 'supply' && (
            <div className="space-y-4 p-4 bg-violet-50/50 rounded-xl border border-violet-100">
              <h3 className="text-sm font-semibold text-violet-900">Supply Details</h3>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" placeholder="Quantity"
                className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          )}
        </div>

        <button type="submit" disabled={saving}
          className="w-full mt-8 py-3 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
