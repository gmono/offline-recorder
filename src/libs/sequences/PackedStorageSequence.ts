import { ISequence, IStorage } from "../commom";

export class PackedStorageSequence implements ISequence{
  constructor(protected storage: IStorage) {
    
  }
  async pushToStart(blob: Blob): Promise<void> {
    this.start--;
    await this.storage.pushBlock(this.start.toString(), blob);
  }
  async removeStart(): Promise<void> {
    if (this.start == this.end) throw new Error("已经到底");
    await this.storage.removeBlock(this.start.toString())
    this.start++;
  }

  length = async () => this.end-this.start;
  //双端
  start = 0;
  end = 0;
  async pushToEnd(blob: Blob): Promise<void> {
    //存储
    await this.storage.pushBlock(this.end.toString(), blob);
    this.end++;
  }

  transformIDX(idx: number) {
    return idx+this.start
  }
  async get(idx: number): Promise<Blob> {
    //执行idx转换
    idx = this.transformIDX(idx);
    if (idx < this.end&&idx>=this.start) {
      return await this.storage.getBlock(idx.toString())
    }
    throw new Error("idx越界");
  }
  async set(idx: number, blob: Blob): Promise<void> {
    idx=this.transformIDX(idx)
    if(this.storage.updateBlock)
      await this.storage.updateBlock(idx.toString(), blob);
    throw new Error("存储器不支持覆写")
  }
  async removeEnd(): Promise<void> {
    if (this.start == this.end) throw new Error("已经到底");
    this.end--;
    await this.storage.removeBlock(this.end.toString());
  }

}