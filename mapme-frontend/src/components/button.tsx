import React from "react";

type ButtonProps = {
  text: string;
  onClick: () => void;
};

//button component
export const Button: React.FC<ButtonProps> = ({ text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer bg-[#5465FF] text-[#E2FDFF] rounded-full px-10 py-3 text-lg hover:bg-[#4252cc] transition"
    >
      {text}
    </button>
  );
};


