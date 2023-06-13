import React, { useState } from "react";
import classes from "./image-viewer.module.css";
import { classNames } from "../helpers/dom";

export namespace ImageViewer {
  export interface Props {
    className?: string | undefined;
    imageUrl?: string | undefined;
    filePath?: string | undefined;
  }
}

export const ImageViewer: React.FC<ImageViewer.Props> = React.memo(({ className, imageUrl, filePath }) => {
  const [zoom, setZoom] = useState(1);

  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(Math.pow(10, e.currentTarget.valueAsNumber * 2 - 1));
  };

  return (
    <div className={classNames(className, classes["imageViewer"])}>
      <div className={classes["controls"]}>
        <input defaultValue={0.5} type="range" min="0" max="1" step="0.01" onChange={handleZoom} />
      </div>
      <div className={classes["stage"]}>
        <img
          className={classNames(classes["view"], classes["checkersBg"])}
          src={imageUrl}
          title={filePath}
          style={{
            transform: `scale(${zoom})`,
          }}
        />
      </div>
    </div>
  );
});

ImageViewer.displayName = "ImageViewer";
