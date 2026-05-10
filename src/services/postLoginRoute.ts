/**
 * Post-login route resolver.
 *
 * Source of truth: licence_seats.role (Atlas Studio Suite).
 * The buyer of the app in Atlas Studio is provisioned as app_super_admin and
 * lands on /admin. Everyone else lands on /user. Atlas Studio owns role
 * assignment — this app only reads it.
 *
 * IMPORTANT: queries filter on Advist's Atlas Studio product (slug='advist').
 * Without this filter, a user holding a seat for another app of the suite
 * (Cockpit F&A, TableSmart, …) would be misidentified as having Advist access.
 */
import { supabase } from '../lib/supabase';
import { ADMIN_SEAT_ROLES, ADVIST_PRODUCT_SLUG, type UserRole } from '../types';

export async function resolveSeatRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('licence_seats')
    .select('role, licences!inner(products!inner(slug))')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('licences.products.slug', ADVIST_PRODUCT_SLUG)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data?.role as UserRole | undefined) ?? null;
}

export async function getPostLoginRoute(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return '/login';

  const role = await resolveSeatRole(user.id);
  const isAtlasSuperAdmin =
    (user.app_metadata as Record<string, unknown> | undefined)?.is_atlas_super_admin === true;

  if (isAtlasSuperAdmin) return '/superadmin';
  return role && ADMIN_SEAT_ROLES.includes(role) ? '/admin' : '/user';
}
