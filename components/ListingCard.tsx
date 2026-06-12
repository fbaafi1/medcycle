import Link from 'next/link';
import { Listing } from '@/lib/types';

const categoryColors: Record<string, string> = {
  medication: 'bg-blue-50 text-blue-700 border-blue-200',
  equipment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  supply: 'bg-violet-50 text-violet-700 border-violet-200',
};

/** Returns expiry urgency info for a medication listing. */
function getExpiryInfo(expiryDate: string | null): {
  label: string;
  style: string;
  pulse: boolean;
} | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return null; // already expired — auto-deleted by cron, shouldn't render
  if (daysLeft === 0) return { label: 'Expires Today', style: 'bg-red-600 text-white border-red-700', pulse: true };
  if (daysLeft <= 7)  return { label: `Expires in ${daysLeft}d`, style: 'bg-red-500 text-white border-red-600', pulse: true };
  if (daysLeft <= 30) return { label: 'Expires Soon', style: 'bg-orange-400 text-white border-orange-500', pulse: false };
  return null;
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const expiryInfo = listing.category === 'medication' ? getExpiryInfo(listing.expiry_date) : null;
  const isAvailable = listing.status === 'available';
  const isPending = listing.is_approved === false;

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className={`bg-white rounded-xl border overflow-hidden card-hover group h-[380px] flex flex-col ${isPending ? 'border-amber-200' : 'border-border'}`}>
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              loading="lazy"
              decoding="async"
              width={400}
              height={192}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          {/* Status & expiry badges */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {isPending && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Pending Approval
              </span>
            )}
            {expiryInfo && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${expiryInfo.style}`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-white/70 ${expiryInfo.pulse ? 'animate-pulse' : ''}`} />
                {expiryInfo.label}
              </span>
            )}
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
              {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
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
              <p>
                Expires:{' '}
                <span className={`font-medium ${
                  expiryInfo?.pulse ? 'text-red-600' : expiryInfo ? 'text-orange-500' : ''
                }`}>
                  {new Date(listing.expiry_date).toLocaleDateString()}
                </span>
              </p>
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
