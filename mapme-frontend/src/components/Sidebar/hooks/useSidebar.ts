import { useState } from "react";

/**
 * This hook is used to manage the sidebar.
 */
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
