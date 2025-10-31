export type RoleName = "admin" | "manager" | "viewer";

export function hasAnyRole(userRoles: string[] | undefined, allowed: RoleName[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return allowed.some((r) => userRoles.includes(r));
}


