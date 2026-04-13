import React, { useEffect } from "react";

// tracking
import { tracking } from "./tracking";

export const AnalyticsApp = () => {
  useEffect(() => {
    setTimeout(() => {
      tracking.log("pageload", {
        component: "AnalyticsApp",
      });
      tracking.log("app-rendered", {
        component: "AnalyticsApp",
      });
    }, 5000);
  }, []);

  return <div>Analytics App that works in offline mode as well</div>;
};
