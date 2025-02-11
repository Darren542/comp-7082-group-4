import { useState } from "react";

const useSidebar = () => {
  const [isAvailableCollapsed, setIsAvailableCollapsed] = useState(false);
  const [isInstalledCollapsed, setIsInstalledCollapsed] = useState(false);

  return {
    isAvailableCollapsed,
    isInstalledCollapsed,
    setIsAvailableCollapsed,
    setIsInstalledCollapsed,
  };
};

export default useSidebar;
