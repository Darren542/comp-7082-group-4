import React from "react";

type InputFieldProps = {
    placeholder: string;
  };  

export const InputField: React.FC<InputFieldProps> = ({ placeholder }) => {
    return (
      <input
        type="text"
        placeholder={placeholder}
        className="border-2 border-[#5465FF] text-[#5465FF] bg-[#E2FDFF] rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#5465FF]"
      />
    );
  };

