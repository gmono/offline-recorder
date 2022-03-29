declare type FSModule = typeof import("browserfs/dist/node/core/node_fs").default;
declare interface Window {
  require: typeof import("browserfs").BFSRequire;
}
