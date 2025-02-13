import { CesiumProvider } from "../../components/CesiumContext/CesiumProvider";
import { AddonProvider } from "../../components/AddonManagerContext/AddonProvider";
import AddonManager from "../../components/AddonManager";

export const MapPage = () => {
  return (
    <CesiumProvider>
      <AddonProvider>
        <div style={{ display: "flex", height: "calc(100vh - 60xpx)" }}>
          <AddonManager />
        </div>
      </AddonProvider>
    </CesiumProvider>
  );
};


