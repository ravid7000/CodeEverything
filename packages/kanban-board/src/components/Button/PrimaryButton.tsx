import React, { ButtonHTMLAttributes } from "react";

// styles
import "./primaryButton.styles.css";

// types
export interface PrimaryButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const PrimaryButton = ({ children, ...rest }: PrimaryButtonProps) => {
  return (
    <button {...rest} className="btn btn-primary">
      {children}
    </button>
  );
};
