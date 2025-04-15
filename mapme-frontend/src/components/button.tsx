import React from "react";

type ButtonProps = {
  id?: string;
  text: string;
  onClick: () => void;
};

export const Button: React.FC<ButtonProps> = ({ id, text, onClick }) => {
  // Remove Whitespace from text to use as id if id is not provided
  if (!id) {
    id = text.replace(/\s+/g, "").toLowerCase();
  }
  return (
    <button
      data-testid={id}
      id={id ?? undefined}
      onClick={onClick}
      className="cursor-pointer bg-[#5465FF] text-[#E2FDFF] rounded-full px-10 py-3 text-lg hover:bg-[#4252cc] transition"
    >
      {text}
    </button>
  );
};