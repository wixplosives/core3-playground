import React, { useEffect, useRef, useState } from "react";
import { previewIframeHTMLIndex } from "../constants";
import { classNames } from "../helpers/dom";
import classes from "./preview.module.css";

const aboutBlank = "about:blank";

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
  const [iframeSrc, setIframeSrc] = useState(previewIframeHTMLIndex);

  const onReloadClick = () => {
    setIframeSrc(aboutBlank);
  };

  const onLoad: React.ReactEventHandler<HTMLIFrameElement> = ({ currentTarget }) => {
    if (iframeSrc === aboutBlank) {
      setIframeSrc(previewIframeHTMLIndex);
    } else {
      onPreviewLoad?.(filePath, currentTarget);
    }
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
        src={iframeSrc}
        ref={iframeRef}
        sandbox="allow-scripts"
        data-file-path={filePath}
        onLoad={onLoad}
      />
    </div>
  );
});

Preview.displayName = "Preview";
