import { useAuth } from "@/contexts/AuthContext";
import { employeeMenuItems } from "./employee";
import { managerMenuItems } from "./manager";
import { adminMenuItems } from "./admin";
import type { NavItem } from "./employee";

/**
 * Get menu items based on user role
 * ADMIN gets all menus, MANAGER gets manager + employee, EMPLOYEE gets only employee
 */
export function getMenuItems(role?: string): NavItem[] {
  switch (role) {
    case "ADMIN":
      return [...adminMenuItems, ...managerMenuItems, ...employeeMenuItems];
    case "MANAGER":
      return [...managerMenuItems, ...employeeMenuItems];
    case "EMPLOYEE":
      return employeeMenuItems;
    default:
      return [];
  }
}

/**
 * Hook to get menu items based on current user role
 */
export function useMenuItems(): NavItem[] {
  const { user } = useAuth();
  return getMenuItems(user?.role);
}

export { employeeMenuItems, managerMenuItems, adminMenuItems };
export type { NavItem } from "./employee";

