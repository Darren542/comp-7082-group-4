import React from "react";
import { CesiumProvider } from "./components/CesiumContext/CesiumProvider";
import { AddonProvider } from "./components/AddonManagerContext/AddonProvider";
import AddonManager from "./components/AddonManager";

const App = () => {
  return (
    // TODO Set these to be rendered after someone logs in.
    <CesiumProvider>
      <AddonProvider>
        <div style={{ display: "flex", height: "calc(100vh - 60xpx)" }}>
          <AddonManager />
        </div>
      </AddonProvider>
    </CesiumProvider>
  );
};

export default App;
