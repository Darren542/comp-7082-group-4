interface InputFieldProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ placeholder, value, onChange, type = "text" }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-md px-3 py-2 w-full"
    />
  );
};
