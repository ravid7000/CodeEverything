import React, { ReactNode, useContext, useState } from "react";
import { BackendDataItemType } from "./api";
import { StateContext } from "./context";

interface ListProps {
  children: ReactNode | null;
  id?: string;
  expandable?: boolean;
  expanded?: boolean;
  onClick: (id: string) => void;
}

export const List = ({ children }: { children: ReactNode }) => {
  return <ul>{children}</ul>;
};

export const ListItem = ({
  children,
  id,
  expandable,
  expanded,
  onClick,
}: ListProps) => {
  const handleClick = () => {
    if (typeof onClick === "function" && id) {
      onClick(id);
    }
  };

  return (
    <li>
      {expandable && (
        <button
          className={`btn${expanded ? " open" : ""}`}
          onClick={handleClick}
        >
          <span />
        </button>
      )}
      {children}
    </li>
  );
};

interface RenderListProps {
  items?: BackendDataItemType[];
  level?: number;
}

const RenderListItem = ({
  item,
  level,
}: {
  item: BackendDataItemType;
  level?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState<string[]>([]);

  const onExpandItem = (id: string) => {
    setIsExpanded((prevIds) => {
      const prevId = prevIds.find((prevId) => prevId === id);
      if (prevId) {
        return prevIds.filter((prevId) => prevId !== id);
      }
      return [...prevIds, id];
    });
  };

  const hasChild = Array.isArray(item.subItems);
  const isExpand = isExpanded.includes(item.id);

  return (
    <ListItem
      key={item.id}
      id={item.id}
      expandable={hasChild}
      expanded={isExpand}
      onClick={onExpandItem}
    >
      {item.name}
      {hasChild && isExpand && (
        <MemoizedRenderList
          items={item.subItems}
          level={level ? level + 1 : 0}
        />
      )}
    </ListItem>
  );
};

export const RenderList = ({ items, level }: RenderListProps) => {
  console.log("RenderList renders, level:", level);

  const { loading, data } = useContext(StateContext);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return (
    <List>
      {(items || data).map((item) => {
        return <RenderListItem key={item.id} item={item} level={level} />;
      })}
    </List>
  );
};

const MemoizedRenderList = React.memo(RenderList);

RenderList.defaultProps = {
  level: 0,
};
