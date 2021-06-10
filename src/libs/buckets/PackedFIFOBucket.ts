import { IBucket, IFIFO } from "../commom";

class PackedFIFOBucket implements IBucket{
  constructor(protected fifo: IFIFO) {
    
  }
  async push(blob: Blob) {
    await this.fifo.push(blob)
  }
  async getSequenceURL() {
    return "";
  }
  async getConcatBlob() {
    return null as Blob;
  }

}

