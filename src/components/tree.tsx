import React from "react";

export namespace Tree {
  export interface Props<T extends Item> extends React.HTMLAttributes<HTMLDivElement> {
    roots?: T[] | undefined;
    ItemComp: React.ComponentType<ItemProps<T>>;
  }

  export interface Item {
    id: string;
  }

  export interface ItemProps<T extends Item> {
    item: T;
    depth: number;
  }
}

export const Tree = memoGeneric(function Tree<T extends Tree.Item>({ roots, ItemComp, ...rootProps }: Tree.Props<T>) {
  return (
    <div {...rootProps} className={rootProps.className}>
      {roots?.map((item) => (
        <ItemComp key={item.id} item={item} depth={0} />
      ))}
    </div>
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function memoGeneric<T extends React.ComponentType<any>>(Comp: T) {
  return React.memo(Comp) as unknown as T;
}
