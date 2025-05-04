import React, { useEffect, useRef } from "react";
import { previewIframeHTMLIndex } from "../constants";
import { classNames } from "../helpers/dom";
import classes from "./preview.module.css";

export namespace Preview {
  export interface Props {
    className?: string | undefined;
    filePath: string;
    onPreviewLoad?: ((filePath: string, iframe: HTMLIFrameElement) => unknown) | undefined;
    onPreviewClose?: ((filePath: string) => unknown) | undefined;
  }
}

export const Preview: React.FC<Preview.Props> = React.memo(({ className, filePath, onPreviewLoad, onPreviewClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const onReloadClick = () => {
    iframeRef.current!.src = previewIframeHTMLIndex;
  };

  const onLoad: React.ReactEventHandler<HTMLIFrameElement> = ({ currentTarget }) => {
    onPreviewLoad?.(filePath, currentTarget);
  };

  useEffect(
    () => () => {
      onPreviewClose?.(filePath);
    },
    [filePath, onPreviewClose],
  );

  return (
    <div className={classNames(classes["preview"], className)}>
      <button className={classes["reloadButton"]} onClick={onReloadClick}>
        Reload
      </button>
      <iframe
        className={classes["previewIframe"]}
        src={previewIframeHTMLIndex}
        ref={iframeRef}
        data-file-path={filePath}
        onLoad={onLoad}
      />
    </div>
  );
});

Preview.displayName = "Preview";
