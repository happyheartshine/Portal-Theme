import React from "react";
import { GridIcon, GroupIcon, TrashBinIcon } from "@/icons";
import type { NavItem } from "./employee";

// Admin menu items - using React.createElement to avoid serialization issues
export const adminMenuItems: NavItem[] = [
  {
    icon: React.createElement(GridIcon),
    name: "Dashboard",
    path: "/admin/dashboard",
  },
  {
    icon: React.createElement(GroupIcon),
    name: "User Management",
    path: "/admin/users",
  },
  {
    icon: React.createElement(TrashBinIcon),
    name: "Data Purge",
    path: "/admin/purge",
  },
];

export default adminMenuItems;

