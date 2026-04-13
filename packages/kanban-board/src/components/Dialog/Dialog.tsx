import React from "react";

// components
import { Overlay } from "./Overlay";
import { IconButton } from "../Button";

// styles
import "./dialog.styles.css";

// types
interface DialogProps {
  open: boolean;
  children?: React.ReactNode;
  header?: string;
  footer?: React.ReactNode;
  onClose?: (close: boolean) => void;
}

export const Dialog = ({
  open,
  children,
  header,
  footer,
  onClose,
}: DialogProps) => {
  const handleDialogClose = () => {
    if (typeof onClose === "function") {
      onClose(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Overlay>
      <div className="dialog">
        {header && (
          <div className="dialog-header">
            <h4>{header}</h4>
            <IconButton iconName="close" onClick={handleDialogClose} />
          </div>
        )}
        {children && <div className="dialog-content">{children}</div>}
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </Overlay>
  );
};
