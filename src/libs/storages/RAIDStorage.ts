/**
 * 类似raid的备份存储，按顺序排列几个storage，以第一个为主体，存储到第一个中，并在同时把存储命令分发到其他
 * storage 当第一个数据不可用或错误时，按顺序使用备份存储提供数据并尝试恢复第一级的数据
 * 存储数据的同时会存储数据的crc校验到 key_crc中
 */

import { IStorage } from "../commom";

//这里设定接口

/**
 * 代理存储 支持crc校验并自动备份数据
 */
export class RAIDStorage implements IStorage {
  constructor(public storageQueue: IStorage[]) {}
  get mainStorage() {
    return this.storageQueue[0];
  }
  async entities(): Promise<[string, Blob][]> {
    let lastError: unknown = null;
    for (const storage of this.storageQueue) {
      try {
        return await storage.entities();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error("没有可用的存储后端");
  }
  async clear(): Promise<void> {
    await Promise.all(this.storageQueue.map((storage) => storage.clear().catch(() => undefined)));
  }
  async count(): Promise<number> {
    return (await this.entities()).length;
  }
  async hasBlock(id: string): Promise<boolean> {
    for (const storage of this.storageQueue) {
      try {
        if (await storage.hasBlock(id)) {
          return true;
        }
      } catch {
        // ignore and continue fallback
      }
    }
    return false;
  }
  async getBlock(id: string): Promise<Blob> {
    let lastError: unknown = null;
    for (let index = 0; index < this.storageQueue.length; index += 1) {
      const storage = this.storageQueue[index];
      try {
        if (!(await storage.hasBlock(id))) {
          continue;
        }

        const blob = await storage.getBlock(id);
        await Promise.all(
          this.storageQueue.slice(0, index).map(async (fallback) => {
            try {
              if (!(await fallback.hasBlock(id))) {
                await fallback.pushBlock(id, blob);
              }
            } catch {
              // ignore self-healing failures
            }
          }),
        );
        return blob;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error(`未找到存储块: ${id}`);
  }
  async pushBlock(id: string, blob: Blob): Promise<void> {
    await Promise.all(this.storageQueue.map((storage) => storage.pushBlock(id, blob)));
  }
  async updateBlock(id: string, blob: Blob): Promise<void> {
    await Promise.all(
      this.storageQueue.map((storage) =>
        storage.updateBlock ? storage.updateBlock(id, blob) : storage.pushBlock(id, blob),
      ),
    );
  }
  async removeBlock(id: string): Promise<void> {
    await Promise.all(this.storageQueue.map((storage) => storage.removeBlock(id).catch(() => undefined)));
  }
}

//简单包装的体系

//这里开始考虑
