import { IFIFO, ISequence } from "../commom";

class PackedSequenceFIFO implements IFIFO{
  constructor(protected sequence: ISequence) {
    
  }
  push(blob: Blob): Promise<void> {
    throw new Error("Method not implemented.");
  }
  pop(): Blob {
    throw new Error("Method not implemented.");
  }

}