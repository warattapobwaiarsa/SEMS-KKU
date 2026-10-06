export type UserRole = "admin" | "evaluator";

export interface NavItemConfig {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  faculty?: string;
  expiresAt?: string | null;
}
