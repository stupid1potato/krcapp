export function isStaffRole(role: string | null | undefined) {
  return role === "staff" || role === "admin";
}
