import Link from 'next/link';
import { Listing } from '@/lib/types';

const categoryIcons: Record<string, string> = {
  medication: '💊',
  equipment: '🏥',
  supply: '📦',
};

const categoryColors: Record<string, string> = {
  medication: 'bg-blue-50 text-blue-700 border-blue-200',
  equipment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  supply: 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const isAvailable = listing.status === 'available';

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="bg-white rounded-xl border border-border overflow-hidden card-hover group h-[380px] flex flex-col">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">{categoryIcons[listing.category] || '📋'}</span>
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isAvailable ? 'badge-available' : 'badge-taken'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {isAvailable ? 'Available' : 'Taken'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 min-h-0">
          {/* Category */}
          <div className="mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${categoryColors[listing.category]}`}>
              {categoryIcons[listing.category]} {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-text line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-text-secondary line-clamp-2 mb-3 leading-relaxed">
            {listing.description}
          </p>

          {/* Category-specific info */}
          <div className="text-xs text-text-secondary space-y-0.5">
            {listing.category === 'medication' && listing.expiry_date && (
              <p>Expires: <span className="font-medium">{new Date(listing.expiry_date).toLocaleDateString()}</span></p>
            )}
            {listing.category === 'equipment' && listing.condition && (
              <p>Condition: <span className="font-medium capitalize">{listing.condition.replace('_', ' ')}</span></p>
            )}
            {listing.category === 'supply' && listing.quantity && (
              <p>Quantity: <span className="font-medium">{listing.quantity}</span></p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {listing.profiles?.organization_name || 'Anonymous'}
            </span>
            <span className="text-xs text-text-secondary">
              {new Date(listing.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
