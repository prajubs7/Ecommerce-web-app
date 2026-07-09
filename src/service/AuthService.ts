import { supabase } from "../api/supabaseClient";
import type { Profile, SignUpInput, UserRole } from "../types/auth.types";

export class AuthService {

    
  static async signUp({
    email,
    password,
    fullName,
    role = "customer",
  }: SignUpInput) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (error) throw new Error(`AuthService.signUp: ${error.message}`);

    // Profile creation happens in useAuthListener on SIGNED_IN event.
    // Only create here if session is immediately available
    // (i.e. email confirmation is disabled).
    if (data.session && data.user) {
      await AuthService.createProfileIfMissing({
        id: data.user.id,
        email,
        user_metadata: { full_name: fullName, role },
      });
    }

    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(`AuthService.signIn: ${error.message}`);
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`AuthService.signOut: ${error.message}`);
  }

  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(`AuthService.getProfile: ${error.message}`);
    return data as Profile | null;
  }

  static async createProfileIfMissing(user: {
    id: string;
    email: string;
    user_metadata: Record<string, unknown>;
  }): Promise<Profile | null> {
    // Check first — avoids duplicate insert errors
    const existing = await AuthService.getProfile(user.id);
    if (existing) return existing;

    const role = (user.user_metadata?.role as UserRole) ?? "customer";

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: (user.user_metadata?.full_name as string) ?? "",
        role,
        vendor_status: role === "vendor" ? "pending" : null,
      })
      .select()
      .single();

    if (error)
      throw new Error(`AuthService.createProfileIfMissing: ${error.message}`);
    return data as Profile;
  }

  static async updateProfile(
    userId: string,
    updates: Partial<
      Pick<Profile, "full_name" | "avatar_url" | "vendor_status">
    >,
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new Error(`AuthService.updateProfile: ${error.message}`);
    return data as Profile;
  }

  static async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`AuthService.getAllProfiles: ${error.message}`);
    return data as Profile[];
  }

  static async updateVendorStatus(
    id: string,
    status: "approved" | "rejected",
  ): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ vendor_status: status })
      .eq("id", id);

    if (error)
      throw new Error(`AuthService.updateVendorStatus: ${error.message}`);
  }
}
