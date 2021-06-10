import { ISequence, IStorage } from "../commom";

class PackedStorageSequence implements ISequence{
  constructor(protected storage: IStorage) {
    
  }
  push(blob: Blob): Promise<void> {
    throw new Error("Method not implemented.");
  }
  get(idx: number): Promise<Blob> {
    throw new Error("Method not implemented.");
  }
  set(idx: number, blob: Blob): Promise<void> {
    throw new Error("Method not implemented.");
  }
  pop(): Promise<void> {
    throw new Error("Method not implemented.");
  }

}