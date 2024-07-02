import React, { createContext, useContext, useState, useEffect } from "react";

interface DeviceContextProps {
  isTouchDevice: boolean;
  showContextMenu: boolean;
  setShowContextMenu: (show: boolean) => void;
}

const DeviceContext = createContext<DeviceContextProps | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  useEffect(() => {
    setIsTouchDevice(navigator.maxTouchPoints > 0);
  }, []);

  return (
    <DeviceContext.Provider
      value={{ isTouchDevice, showContextMenu, setShowContextMenu }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDeviceContext = () => {
  const context = useContext(DeviceContext);

  if (context === undefined) {
    throw new Error("useDeviceContext must be used within a DeviceProvider");
  }

  return context;
};
