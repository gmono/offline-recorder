import { IBucket, IFIFO } from "../commom";

class PackedFIFOBucket implements IBucket{
  constructor(protected fifo: IFIFO) {
    
  }
  push(blob: Blob): void {
    throw new Error("Method not implemented.");
  }
  getSequenceURL(): string {
    throw new Error("Method not implemented.");
  }
  getConcatBlob(): Blob {
    throw new Error("Method not implemented.");
  }

}

