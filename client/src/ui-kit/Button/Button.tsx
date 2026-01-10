import type { ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  classess?: string;
};

export const Button = ({ children, classess = "", ...props }: ButtonProps) => {
  return (
    <button className={`button ${classess}`} {...props}>
      {children}
    </button>
  );
};