import React from "react";

export interface Tab {
  title: string;
}

export interface TabsProps {
  tabs: Tab[];
}

export const Tabs: React.FC<TabsProps> = ({ tabs }) => {
  return <main>{tabs.map(({ title }) => `[${title}]`)}</main>;
};
