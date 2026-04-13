import React, { DOMAttributes } from "react";

// components
import { IconButton } from "../Button";

// styles
import "./workspaceCard.styles.css";

// types
interface WorkspaceCardProps extends DOMAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  header?: string;
  onAdd?: () => void;
}

export const WorkspaceCard = ({
  children,
  header,
  onAdd,
  ...rest
}: WorkspaceCardProps) => {
  const handleAddClick = () => {
    if (typeof onAdd === "function") {
      onAdd();
    }
  };

  return (
    <div className="workspace-card" {...rest}>
      {header && <h3 className="workspace-card-header">{header}</h3>}
      <div className="workspace-card-content">
        {children}
        <div className="workspace-card-control">
          <IconButton fullWidth iconName="add" onClick={handleAddClick} />
        </div>
      </div>
    </div>
  );
};
