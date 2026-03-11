# libs 分层说明

`offline-recorder/src/libs` 保持三层结构，不让具体存储能力直接渗透到业务层：

1. `IStorage`：最底层的块存储接口，只关心 `id -> Blob`
2. `ISequence`：基于 `IStorage` 的顺序访问封装
3. `IBucket`：面向媒体录制/回放的更高层封装

## 当前后端
- `IndexedDBStorage`：浏览器内置持久化，零权限。
- `OPFSStorage`：使用 Origin Private File System，适合大文件和更稳定的写入。
- `DirectoryAccessStorage`：基于 File System Access API，允许用户选择本地目录作为后端。
- `RAIDStorage`：把多个 `IStorage` 组合成主从/回退后端，例如 `OPFS + IndexedDB` 或 `本地目录 + IndexedDB`。

## 建议接入方式
- UI / 应用层不要直接操作 `showDirectoryPicker()`、`navigator.storage.getDirectory()` 返回的 handle。
- 统一在 `recordingStorage.ts` 中创建具体后端，再交给 `PackedStorageSequence` / `PackedSequenceBucket` 组合。
- 这样新增后端时，只需要新增 `IStorage` 实现，不需要破坏上层录制逻辑。

## 典型组合
- 纯浏览器持久化：`indexeddb`
- 更强本地持久化：`opfs`
- 用户显式选目录：`directory-access`
- 自动回退：`hybrid-opfs-indexeddb` / `hybrid-directory-indexeddb`

## 约束
- 业务层只能依赖接口或工厂函数，避免重新回到“UI 直接操作文件句柄”的退化结构。
- 新能力优先扩展在 `storages/`，顺序和桶逻辑继续复用 `sequences/` 与 `buckets/`。
