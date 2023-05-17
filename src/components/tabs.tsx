import React from "react";

export interface Tab {
  title: string;
}

export interface TabsProps {
  tabs?: Tab[];
}

export const Tabs: React.FC<TabsProps> = () => {
  return <main>Main Content</main>;
};
