import { assert, delay, zip } from "ts-pystyle";

export async function waitFor(cbk: () => Promise<boolean>) {
  while (!(await cbk())) {
    await delay(0);
  }
}

export function getDescriptOfSize(
  size: number,
  descs: string[],
  base: number[]
) {
  assert(descs.length == base.length + 1);
  //byte kb mb gb ....

  const lst = [] as number[];
  base.forEach((v, idx) => {
    const b = v;
    const now = size % b;
    const next = Math.floor(size / b);
    lst.push(now);
    size = next;
  });
  lst.push(size);
  const descr = descs.reverse();
  return lst.reverse().reduce((p, c, idx) => {
    if (c == 0) return p;
    return p + `${c}${descr[idx]}`;
  }, "");
}

export function getDescriptOfSize2(
  size: number,
  descs: string[],
  base: number[]
) {
  assert(descs.length == base.length + 1);
  //byte kb mb gb ....

  if (size == 0 || size == null) return 0 + descs[0];
  const lst = [] as number[];
  let nowbase = 1;
  let descp = 0;
  let desc = descs[0];
  let s = size;
  for (const b of base) {
    if (s / b > 1) {
      nowbase *= b;
      desc = descs[++descp];
      s = s / b;
    } else break;
  }
  return `${s}${desc}`;
}
