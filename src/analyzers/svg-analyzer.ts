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
let __html;
const svgProps = {};

function parseSvg() {
  const domParser = new DOMParser();
  const xmlDoc = domParser.parseFromString(svgContents, "image/svg+xml");
  const svgElement = xmlDoc.documentElement;
  for (const attribute of svgElement.attributes) {
    svgProps[attribute.name] = attribute.value;
  }
  __html = svgElement.innerHTML;
}

exports.ReactComponent = ReactComponent;

function ReactComponent({ className }) {
  if (__html === undefined) {
    parseSvg(svgContents);
  }
  return React.createElement(
    "svg",
    {
      ...svgProps,
      className: className !== undefined ? className : svgProps.className,
      dangerouslySetInnerHTML: { __html },
    },
    null
  );
}\n`,
      requests: ["react"],
    };
  },
};

function isSvgFile({ fileExtension }: ModuleAnalyzerContext) {
  return fileExtension === ".svg";
}
