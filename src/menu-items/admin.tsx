import React from "react";
import { GridIcon, GroupIcon, TrashBinIcon } from "@/icons";
import type { NavItem } from "./employee";

// Admin menu items
export const adminMenuItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin/dashboard",
  },
  {
    icon: <GroupIcon />,
    name: "User Management",
    path: "/admin/users",
  },
  {
    icon: <TrashBinIcon />,
    name: "Data Purge",
    path: "/admin/purge",
  },
];

export default adminMenuItems;

