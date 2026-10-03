import type { ElementType, ReactNode } from "react";

type ContainerProps = {
  className?: string;
  children?: ReactNode;
  as?: ElementType;
};

export function Container({
  className = "",
  children,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag className={`mx-auto w-full px-4 md:px-8 ${className}`.trim()}>
      {children}
    </Tag>
  );
}
