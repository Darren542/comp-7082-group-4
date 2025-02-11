import { Rnd } from "react-rnd";

type AddonWindowProps = {
  name: string;
  onClose: (addonName: string) => void;
};

export const AddonWindow = ({ name, onClose }: AddonWindowProps) => {
  return (
    <Rnd
      default={{
        x: 150,
        y: 100,
        width: 300,
        height: 200,
      }}
      minWidth={250}
      minHeight={150}
      bounds="window" // Prevents dragging off-screen
      enableResizing={{
        bottomRight: true,
        bottomLeft: true,
        topRight: true,
        topLeft: true,
        right: true,
        left: true,
        bottom: true,
        top: true,
      }}
      dragHandleClassName="addon-window-header"
      style={{ zIndex: 9999 }} 
      className="fixed bg-white border border-gray-300 shadow-lg rounded-md"
    >
      {/* Window Header (Drag Handle) */}
      <div className="addon-window-header cursor-move bg-gray-600 text-white p-2 rounded-t-md flex justify-between">
        <span>{name} Details</span>
        <button className="text-white" onClick={() => onClose(name)}>✖</button>
      </div>

      {/* Window Content: This should be the Child Element later */}
      <div className="p-2">
        <p>Details about {name} go here...</p>
      </div>
    </Rnd>
  );
};
