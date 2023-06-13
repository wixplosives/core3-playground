import React from "react";
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
  return <img className={classNames(className, classes["imageViewer"])} src={imageUrl} title={filePath} />;
});

ImageViewer.displayName = "ImageViewer";
