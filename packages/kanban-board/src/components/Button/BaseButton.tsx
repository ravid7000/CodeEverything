import React, { ButtonHTMLAttributes } from "react";
import { classnames } from "../../utils/classNames";

// styles
import "./baseButton.styles.css";

// types
export interface BaseButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export const BaseButton = ({
  children,
  fullWidth,
  ...rest
}: BaseButtonProps): JSX.Element => {
  return (
    <button {...rest} className={classnames("btn", fullWidth && "full-width")}>
      {children}
    </button>
  );
};
