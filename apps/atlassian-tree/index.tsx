import React from "react";
import { RenderList } from "./list";
import { StateProvider } from "./context";
import "./style.css";

export const AtlassianTree = (): JSX.Element => {
  console.log("AtlassianTree renders");

  return (
    <StateProvider>
      <div className="app">
        <RenderList />
      </div>
    </StateProvider>
  );
};
