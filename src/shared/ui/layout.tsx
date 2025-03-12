import React from "react";

interface ILayout {
  children: React.ReactNode;
}

export const Layout: React.FC<ILayout> = ({ children }) => {
  return <div className="h-[100vh] ">{children}</div>;
};
