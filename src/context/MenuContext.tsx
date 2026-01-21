"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useMenuItems, NavItem } from "@/menu-items";

interface MenuContextType {
  menuItems: NavItem[];
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const menuItems = useMenuItems();

  return (
    <MenuContext.Provider value={{ menuItems }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
}

