import React, { InputHTMLAttributes } from "react";

// styles
import "./textInput.styles.css";

// types
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const TextInput = ({ label, required, ...rest }: TextInputProps) => {
  return (
    <label className="text-input">
      <span className="text-input-label">
        {label}
        {required ? <span className="required"> *</span> : ""}
      </span>
      <input type="text" {...rest} required={required} />
    </label>
  );
};
