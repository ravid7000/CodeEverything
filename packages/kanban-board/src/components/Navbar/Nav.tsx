import React from "react";

export interface NavProps {
  header?: string;
}

export const Nav = ({ header }: NavProps) => {
  return (
    <nav className="navbar">
      <div className="brand-logo">Kanban Board {header}</div>
    </nav>
  );
};
