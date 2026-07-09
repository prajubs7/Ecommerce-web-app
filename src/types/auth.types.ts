export type UserRole = 'customer' | 'vendor' | 'admin';
export type VendorStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  vendor_status: VendorStatus | null;
  avatar_url: string | null;
  created_at: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}