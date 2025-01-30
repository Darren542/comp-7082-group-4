import React from "react";
import Sidebar from "./components/Sidebar";
import { CesiumProvider } from "./components/CesiumContext/CesiumProvider";
import { AddonProvider } from "./components/AddonManagerContext/AddonProvider";

const App = () => {
  return (
    <CesiumProvider>
      <AddonProvider>
        <div style={{ display: "flex", height: "calc(100vh - 60xpx)" }}>
          <Sidebar />
        </div>
      </AddonProvider>
    </CesiumProvider>
  );
};

export default App;
