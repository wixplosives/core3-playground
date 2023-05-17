declare module "*.module.css" {
  const classNames: Record<string, string>;
  export default classNames;
}

declare module "*.svg" {
  const urlToFile: string;
  export default urlToFile;
}
