// lib/authorization.ts
//
// Centralized region/role authorization for the Inventory module (and
// reusable anywhere else that needs region-scoped access control).
//
// (Lives at lib/authorization.ts rather than lib/auth/authorization.ts
// because lib/auth.ts already exists as a file — a path can't be both a
// file and a folder.)
//
// WHY THIS EXISTS ALONGSIDE DATABASE RLS:
// RLS (see migrations/0004_inventory_region_rls.sql) protects any direct
// database access made with the normal authenticated client. But server
// actions that use the SERVICE-ROLE client (lib/supabase/service.ts) —
// e.g. anything reusing the webhook/automation pipeline — bypass RLS
// entirely. This module is the second, independent layer: call it at the
// top of every server action / API route that touches a region-scoped
// resource, regardless of which Supabase client that action uses.
//
// Regions are data, not hardcoded strings: nothing in this file ever
// compares against "Karachi" or "Faisalabad" — it only ever compares one
// region_id (uuid) against another. Adding a new region later requires
// zero changes here.

import type { Profile } from "@/lib/types";

export type InventoryAction = "view" | "create" | "update" | "delete";

export class AuthorizationError extends Error {
  constructor(message = "You do not have access to this resource.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * The single source of truth for the role/region rule:
 *
 *   super_admin -> always allowed, any region, any action
 *   admin       -> allowed only when resourceRegionId matches their own
 *                  region_id; full CRUD within that region
 *   user        -> allowed only for 'view', and only within their own
 *                  region_id; never create/update/delete
 *
 * A resource with region_id = null (unassigned) is visible to
 * super_admin only — this prevents legacy/unassigned rows from silently
 * being visible to every region until someone deliberately assigns them.
 */
export function canAccessRegion(
  profile: Pick<Profile, "role" | "region_id">,
  resourceRegionId: string | null,
  action: InventoryAction = "view"
): boolean {
  if (profile.role === "super_admin") return true;

  if (resourceRegionId === null) return false;
  if (profile.region_id !== resourceRegionId) return false;

  if (profile.role === "admin") return true;
  if (profile.role === "user") return action === "view";

  return false;
}

/**
 * Throws AuthorizationError if access is not allowed. Call this FIRST,
 * before any read or write, in every server action / route handler that
 * touches a region-scoped Inventory resource:
 *
 *   const profile = await requireProfile();
 *   const item = await getStockItemById(id); // fetch first to know its region
 *   requireRegionAccess(profile, item.region_id, "update");
 *   // ...proceed with the update
 *
 * For CREATE, resourceRegionId is the region_id the new row will be
 * written with (usually profile.region_id itself for admin/user, or an
 * explicitly chosen region for super_admin).
 */
export function requireRegionAccess(
  profile: Pick<Profile, "role" | "region_id">,
  resourceRegionId: string | null,
  action: InventoryAction = "view"
): void {
  if (!canAccessRegion(profile, resourceRegionId, action)) {
    throw new AuthorizationError();
  }
}

/**
 * For LIST/QUERY endpoints: returns the region_id every query should be
 * filtered by, or null to mean "no filter — see everything"
 * (super_admin only). Build every Inventory list query's .eq("region_id", ...)
 * from this single function — never hand-roll that filter elsewhere, so
 * the rule stays in exactly one place.
 *
 *   const regionFilter = regionFilterFor(profile);
 *   let query = supabase.from("stock_items").select("*");
 *   if (regionFilter) query = query.eq("region_id", regionFilter);
 */
export function regionFilterFor(
  profile: Pick<Profile, "role" | "region_id">
): string | null {
  return profile.role === "super_admin" ? null : profile.region_id;
}

/**
 * Convenience guard for write actions (create/update/delete) that also
 * enforces the User role's blanket exclusion from Admin-level operations,
 * independent of region. Use this when the action itself (not just the
 * region) is Admin-and-above only — e.g. deleting a stock item.
 */
export function requireAdminOrAbove(
  profile: Pick<Profile, "role">
): void {
  if (profile.role !== "admin" && profile.role !== "super_admin") {
    throw new AuthorizationError("This action requires Admin access.");
  }
}