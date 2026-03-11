declare type FSModule = typeof import("browserfs/dist/node/core/node_fs").default;
declare interface Window {
  require: typeof import("browserfs").BFSRequire;
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: FileSystemHandlePermissionMode;
    startIn?: string | FileSystemDirectoryHandle;
  }) => Promise<FileSystemDirectoryHandle>;
}

declare type FileSystemHandlePermissionMode = "read" | "readwrite";

declare interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemHandlePermissionMode;
}

declare interface FileSystemHandle {
  readonly kind: "file" | "directory";
  readonly name: string;
  queryPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

declare interface FileSystemWritableFileStream {
  write(
    data:
      | BufferSource
      | Blob
      | string
      | { type: "write"; position?: number; data: BufferSource | Blob | string }
      | { type: "truncate"; size: number }
      | { type: "seek"; position: number }
  ): Promise<void>;
  close(): Promise<void>;
}

declare interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: "file";
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
}

declare interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: "directory";
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}
