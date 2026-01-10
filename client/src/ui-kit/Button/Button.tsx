import type { ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  classess?: string;
};

export const Button = ({ children, classess = "", type = "button", ...rest }: ButtonProps) => {
  return (
    <button type={type} className={`button ${classess}`} {...rest}>
      {children}
    </button>
  );
};