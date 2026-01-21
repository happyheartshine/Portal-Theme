import React from "react";
import { GridIcon, BoxIcon, FileIcon, AlertIcon, DollarLineIcon, ShootingStarIcon } from "@/icons";
import type { NavItem } from "./employee";

// Manager menu items - Manager-only features
export const managerMenuItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/manager/dashboard",
  },
  {
    icon: <BoxIcon />,
    name: "Verify Orders",
    path: "/manager/orders",
  },
  {
    icon: <FileIcon />,
    name: "Process Refunds",
    path: "/manager/refunds",
  },
  {
    icon: <AlertIcon />,
    name: "Discipline",
    path: "/manager/discipline",
  },
  {
    icon: <DollarLineIcon />,
    name: "Deduction",
    path: "/manager/deduction",
  },
  {
    icon: <ShootingStarIcon />,
    name: "Coupon Audit",
    path: "/manager/coupon-audit",
  },
];

export default managerMenuItems;

