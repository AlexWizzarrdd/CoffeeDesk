import type { ComponentPropsWithoutRef } from "react";

export const Button = ({
  children,
  type = "button",
  className,
  ...rest
}: ComponentPropsWithoutRef<"button">) => {
  return (
    <button type={type} className={`button ${className}`} {...rest}>
      {children}
    </button>
  );
};