import React, { createContext } from "react";
import { BackendDataItemType, useFetchData } from "./api";

export type StateContextType = {
  onExpandItem: (id: string) => void;
  expanded: string[];
  loading: boolean;
  data: BackendDataItemType[];
};

export const StateContext = createContext<StateContextType>({
  onExpandItem: () => {},
  expanded: [],
  loading: false,
  data: [],
});

export const StateProvider = ({ children }: { children: JSX.Element }) => {
  const { loading, data, expanded, expandItem } = useFetchData();
  return (
    <StateContext.Provider
      value={{
        loading,
        data,
        expanded,
        onExpandItem: expandItem,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};
