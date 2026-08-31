// Permissions Utility — Defines role-based authorization rules

export type UserRole = "administrator" | "editor" | "author" | "contributor" | "subscriber" | "none" | "admin" | "user";

/**
 * Checks if the role is an Administrator.
 * Maps legacy "admin" to "administrator".
 */
export function isAdmin(role: string): boolean {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "administrator";
}

/**
 * Checks if the role is Editor or above (Administrator).
 */
export function isEditorOrAbove(role: string): boolean {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "administrator" || r === "editor";
}

/**
 * Checks if the role is Author or above (Editor, Administrator).
 */
export function isAuthorOrAbove(role: string): boolean {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "administrator" || r === "editor" || r === "author";
}

/**
 * Checks if the role is Contributor or above (Author, Editor, Administrator).
 */
export function isContributorOrAbove(role: string): boolean {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "administrator" || r === "editor" || r === "author" || r === "contributor";
}

/**
 * Who can publish directly?
 * Administrator, Editor, Author.
 */
export function canPublishDirectly(role: string): boolean {
  return isAuthorOrAbove(role);
}

/**
 * Who can approve posts?
 * Administrator, Editor.
 */
export function canApprovePosts(role: string): boolean {
  return isEditorOrAbove(role);
}

/**
 * Who can manage other users?
 * Administrator only.
 */
export function canManageUsers(role: string): boolean {
  return isAdmin(role);
}

/**
 * Who can compose posts?
 * Contributor and above.
 */
export function canCompose(role: string): boolean {
  return isContributorOrAbove(role);
}
