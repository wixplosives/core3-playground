import { createBase64DataURIModule } from "../helpers/url";
import type { ModuleAnalyzer, ModuleAnalyzerContext } from "./analyzer-types";

export const svgAnalyzer: ModuleAnalyzer = {
  test: isSvgFile,
  async analyze({ filePath, fs }) {
    const fileContents = await fs.readFile(filePath);
    const textContents = new TextDecoder().decode(fileContents);

    return {
      compiledContents: `${createBase64DataURIModule(filePath, fileContents)}
const React = require('react');

const svgContents = ${JSON.stringify(textContents)};
let svgElement;

exports.ReactComponent = React.memo(function ReactComponent({ className, children, ...props }) {
  if (!svgElement) {
    svgElement = new DOMParser().parseFromString(svgContents, "image/svg+xml").documentElement;
  }

  const svgRef = React.useRef(null);

  React.useLayoutEffect(() => {
    let classes = svgElement.getAttribute("class");
    if (className) {
      classes = classes ? (classes + " " + className) : className;
    }
    if (classes) {
      svgRef.current.setAttribute("class", classes);
    } else {
      svgRef.current.removeAttribute("class");
    }
  }, [className]);

  React.useLayoutEffect(() => {
    for (const attribute of svgElement.attributes) {
      if (!svgRef.current.hasAttribute(attribute.name)) {
        svgRef.current.setAttribute(attribute.name, attribute.value);
      }
    }
  }, []);

  return React.createElement(
    "svg",
    {
      ...props,
      ref: svgRef,
      dangerouslySetInnerHTML: { __html: svgElement.innerHTML },
    },
    null
  );
});\n`,
      requests: ["react"],
    };
  },
};

function isSvgFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".svg";
}
