export interface Profile {
  id: string;
  user_id: string;
  organization_name: string;
  contact_person: string;
  phone_number: string;
  location: string;
  license_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export type ListingCategory = 'medication' | 'equipment' | 'supply';
export type ListingStatus = 'available' | 'taken';
export type EquipmentCondition = 'new' | 'used' | 'needs_repair';

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  category: ListingCategory;
  status: ListingStatus;
  // Medication-specific
  generic_name: string | null;
  trade_name: string | null;
  expiry_date: string | null;
  // Equipment-specific
  condition: EquipmentCondition | null;
  // Supply-specific
  quantity: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: Profile;
}
