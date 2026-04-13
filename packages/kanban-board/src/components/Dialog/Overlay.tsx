import React from "react";

// types
interface OverlayProps {
  children?: React.ReactNode;
  onClick?: () => void;
}

export const Overlay = ({ children, onClick }: OverlayProps) => {
  return (
    <div className="dialog-overlay" onClick={onClick}>
      {children}
    </div>
  );
};
