import React, { InputHTMLAttributes } from "react";

// styles
import "./selectInput.styles.css";

// types
interface SelectInputProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: { id: string; name: string }[];
}

export const SelectInput = ({
  label,
  required,
  options,
  ...rest
}: SelectInputProps) => {
  return (
    <label className="select-input">
      <span className="select-input-label">
        {label}
        {required ? <span className="required"> *</span> : ""}
      </span>
      <select {...rest} required={required}>
        {options?.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
};
