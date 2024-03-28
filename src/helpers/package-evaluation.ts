import { createBaseCjsModuleSystem } from "@file-services/commonjs";

export function singlePackageModuleSystem(packageName: string, packageURL: string, packageLibText: string) {
  return createBaseCjsModuleSystem({
    dirname(path) {
      if (path === packageURL) {
        return "/";
      } else {
        throw new Error(`Unexpected path "${path}" passed to dirname during ${packageName} evaluation`);
      }
    },
    readFileSync(path) {
      if (path === packageURL) {
        return `${packageLibText}\n//# sourceURL=${packageURL}`;
      } else {
        throw new Error(`Unexpected file path "${path}" during ${packageName} evaluation`);
      }
    },
    resolveFrom(_contextPath, specifier) {
      throw new Error(`Unexpected request "${specifier}" during ${packageName} evaluation`);
    },
  });
}
