'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ListingCategory, EquipmentCondition } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function CreateListingPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>('medication');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Medication
  const [genericName, setGenericName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Equipment
  const [condition, setCondition] = useState<EquipmentCondition>('new');

  // Supply
  const [quantity, setQuantity] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/listings/create');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user && !profile) {
      router.push('/profile?redirect=/listings/create');
    }
  }, [authLoading, user, profile, router]);

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
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      let imageUrl = null;

      if (imageFile) {
        try {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, imageFile);

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            // Continue without image rather than blocking the listing
          } else {
            const { data } = supabase.storage.from('listing-images').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
          }
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr);
          // Continue without image
        }
      }

      const listingData = {
        user_id: user.id,
        title,
        description,
        category,
        image_url: imageUrl,
        status: 'available' as const,
        generic_name: category === 'medication' ? genericName || null : null,
        trade_name: category === 'medication' ? tradeName || null : null,
        expiry_date: category === 'medication' ? expiryDate || null : null,
        condition: category === 'equipment' ? condition : null,
        quantity: category === 'supply' ? parseInt(quantity) || null : null,
      };

      console.log('Inserting listing:', listingData);

      const { error: insertError } = await supabase.from('listings').insert(listingData);
      
      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      router.push('/my-listings');
    } catch (err: any) {
      console.error('Listing creation error:', err);
      setError(err.message || 'Failed to create listing');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Post a Listing</h1>
        <p className="text-sm text-text-secondary mt-1">Share available medical resources with those who need them.</p>
      </div>

      {/* Disclaimer */}
      <div className="mb-6 p-4 bg-warning/5 border border-warning/20 rounded-xl">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> Ensure all items are safe, properly stored, and suitable for use before listing.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm animate-fade-in">
        {error && (
          <div className="mb-4 p-3 bg-danger/5 border border-danger/20 rounded-lg text-sm text-danger">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'medication', label: 'Medication', color: 'blue' },
                { value: 'equipment', label: 'Equipment', color: 'emerald' },
                { value: 'supply', label: 'Supply', color: 'violet' },
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

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder={
                category === 'medication' ? 'e.g., Amoxicillin 500mg Capsules' :
                category === 'equipment'  ? 'e.g., Manual Wheelchair — Adult Size' :
                'e.g., Sterile Gloves (Box of 100)'
              }
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              placeholder="Provide details about the item..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Image</label>
            {imagePreview && (
              <div className="mb-3 relative rounded-xl overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/5 file:text-primary hover:file:bg-primary/10 cursor-pointer"
            />
          </div>

          {/* Dynamic category fields */}
          {category === 'medication' && (
            <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-1">Medication Details</h3>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Generic Name</label>
                <input
                  type="text"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="e.g., Amoxicillin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Trade Name</label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="e.g., Amoxil"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          {category === 'equipment' && (
            <div className="space-y-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <h3 className="text-sm font-semibold text-emerald-900 flex items-center gap-1">Equipment Details</h3>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Condition *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
                  className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="needs_repair">Needs Repair</option>
                </select>
              </div>
            </div>
          )}

          {category === 'supply' && (
            <div className="space-y-4 p-4 bg-violet-50/50 rounded-xl border border-violet-100">
              <h3 className="text-sm font-semibold text-violet-900 flex items-center gap-1">Supply Details</h3>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Quantity *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="e.g., 100"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full mt-8 py-3 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
        >
          {saving ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}
