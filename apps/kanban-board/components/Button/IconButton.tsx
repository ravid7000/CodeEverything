import React, { ButtonHTMLAttributes } from "react";
import { classnames } from "../../utils/classNames";

// component
import { Icon } from "../Icon";

// styles
import "./iconButton.styles.css";

// types
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconName?: string;
  fullWidth?: boolean;
}

export const IconButton = ({
  iconName,
  fullWidth,
  ...rest
}: IconButtonProps) => {
  return (
    <button
      {...rest}
      className={classnames("btn btn-icon", fullWidth && "full-width")}
    >
      <Icon name={iconName} />
    </button>
  );
};
