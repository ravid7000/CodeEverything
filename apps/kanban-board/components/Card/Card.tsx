import React, { HTMLAttributes } from "react";

// styles
import "./card.styles.css";

// types
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  header?: string;
}

export const Card = ({ children, header, id, ...rest }: CardProps) => {
  return (
    <div data-id={id} className="card" {...rest} draggable>
      {header && <h3 className="card-header">{header}</h3>}
      {children && <div className="card-content">{children}</div>}
    </div>
  );
};
