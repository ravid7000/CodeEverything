import React from "react";

// styles
import "./header.styles.css";

// component
import { Nav, NavProps } from "./Nav";

interface NavbarProps extends NavProps {}

export const Navbar = ({ header }: NavbarProps) => {
  return (
    <header>
      <Nav header={header} />
    </header>
  );
};
