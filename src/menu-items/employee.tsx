import React from "react";
import { GridIcon, CalenderIcon, BoxIcon, FileIcon, ShootingStarIcon, AlertIcon } from "@/icons";

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

// Employee menu items
export const employeeMenuItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <CalenderIcon />,
    name: "Attendance",
    path: "/attendance",
  },
  {
    icon: <BoxIcon />,
    name: "Orders",
    path: "/orders",
  },
  {
    icon: <FileIcon />,
    name: "Refunds",
    path: "/refunds",
  },
  {
    icon: <ShootingStarIcon />,
    name: "Coupons",
    path: "/coupons",
  },
  {
    icon: <AlertIcon />,
    name: "Warnings",
    path: "/warnings",
  },
];

export default employeeMenuItems;

