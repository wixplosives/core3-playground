import React, { useEffect, useRef, useState } from "react";
import type { DevtoolsProps } from "react-devtools-inline/frontend";
import { previewIframeHTMLIndex } from "../constants";
import { classNames } from "../helpers/dom";
import classes from "./preview.module.css";

const aboutBlank = "about:blank";

export namespace Preview {
  export interface Props {
    className?: string | undefined;
    filePath: string;
    DevTools?: React.ComponentType<DevtoolsProps> | undefined;
    onPreviewLoad?: ((filePath: string, iframe: HTMLIFrameElement) => unknown) | undefined;
    onPreviewClose?: ((filePath: string) => unknown) | undefined;
  }
}

export const Preview: React.FC<Preview.Props> = React.memo(
  ({ className, filePath, onPreviewLoad, onPreviewClose, DevTools }) => {
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
        <div className={classes["sideBySide"]}>
          <iframe
            className={classes["previewIframe"]}
            src={iframeSrc}
            ref={iframeRef}
            sandbox="allow-scripts allow-popups allow-modals"
            data-file-path={filePath}
            onLoad={onLoad}
          />
          {DevTools && <DevTools browserTheme="dark" />}
        </div>
      </div>
    );
  },
);

Preview.displayName = "Preview";
