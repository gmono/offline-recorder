/**
 * 流式下载工具 — 使用 OPFS 临时文件 + StreamSaver 实现零内存下载
 *
 * 核心思路：
 * - 不将 Blob 全部加载到 JS 堆
 * - 从 Provider（IFileProvider / IQueueProvider）流式读取数据
 * - 通过 StreamSaver 直接写入下载流
 * - ZIP 打包也无需全部加载，逐个文件流式追加
 */

import saver from 'streamsaver'
import type { IFileProvider, IQueueProvider, AnyProvider } from './providers/common'
import { asFile, asQueue } from './providers/common'

/**
 * 从 IFileProvider 流式下载单个文件
 *
 * 不把文件内容读入 JS 堆，直接用 OPFS File → ReadableStream → StreamSaver
 */
export async function streamingDownloadFile(
  downloadName: string,
  fileProvider: IFileProvider,
  fileKey: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const fileBlob = await fileProvider.getFileBlob(fileKey)
  const totalSize = fileBlob.size

  const writer = saver.createWriteStream(downloadName, { size: totalSize }).getWriter()

  // 使用 ReadableStream + reader 流式读取, 不全部加载
  const stream = fileBlob.stream() as unknown as ReadableStream<Uint8Array>
  const reader = stream.getReader()

  let written = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      await writer.write(value)
      written += value.byteLength
      if (onProgress) {
        onProgress(Math.round((written / totalSize) * 100))
      }
    }
  } finally {
    reader.releaseLock()
    await writer.close()
  }
}

/**
 * 从 IQueueProvider 流式下载（逐 chunk 读取 → 写入下载流）
 *
 * 等同于现有 forceDownload 的模式，但封装为可复用函数
 */
export async function streamingDownloadFromQueue(
  downloadName: string,
  queue: IQueueProvider,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const total = await queue.count()
  if (total === 0) {
    throw new Error('队列为空，没有数据可下载')
  }

  const writer = saver.createWriteStream(downloadName).getWriter()

  try {
    for (let i = 0; i < total; i++) {
      const chunk = await queue.getChunk(i)
      const buf = new Uint8Array(await chunk.arrayBuffer())
      await writer.write(buf)
      if (onProgress) {
        onProgress(Math.round(((i + 1) / total) * 100))
      }
    }
  } finally {
    await writer.close()
  }
}

/**
 * 通用流式下载 — 根据 Provider 类型自动选择最优方式
 *
 * - IFileProvider → 直接文件流式下载（最优，零拷贝）
 * - IQueueProvider → 逐 chunk 流式下载
 * - IHybridProvider → 优先用文件方式
 */
export async function streamingDownloadFromProvider(
  downloadName: string,
  provider: AnyProvider,
  fileKey: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const file = asFile(provider)
  if (file) {
    const hasIt = await file.hasFile(fileKey)
    if (hasIt) {
      return streamingDownloadFile(downloadName, file, fileKey, onProgress)
    }
  }

  const queue = asQueue(provider)
  if (queue) {
    return streamingDownloadFromQueue(downloadName, queue, onProgress)
  }

  throw new Error('Provider 不支持文件或队列操作，无法下载')
}

// ─── ZIP 流式打包 ────────────────────────────────────────────

/**
 * 最小 ZIP 生成器 — 无需加载全部数据到内存
 *
 * 使用 ZIP 的 STORE（无压缩）模式，逐个文件将数据流式写入。
 * 每个文件从 Provider 读取后直接写进 ZIP 流，不在 JS 堆累积。
 *
 * ZIP格式参考:
 * - Local file header + data → 重复 N 次
 * - Central directory → 末尾汇总
 * - End of central directory record
 */

interface ZipEntry {
  name: string       // 文件在 ZIP 内的路径
  fileKey: string    // Provider 中的 key
  infoJson?: string  // 可选的 JSON 信息
}

// CRC-32 查表法
const crc32Table = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c
  }
  return table
})()

function crc32(data: Uint8Array, prev = 0xFFFFFFFF): number {
  let crc = prev
  for (let i = 0; i < data.length; i++) {
    crc = crc32Table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8)
  }
  return crc
}

function textEncoder(): TextEncoder {
  return new TextEncoder()
}

function makeDosDateTime(date: Date): { time: number; dateVal: number } {
  const time = ((date.getHours() & 0x1F) << 11)
    | ((date.getMinutes() & 0x3F) << 5)
    | ((date.getSeconds() >> 1) & 0x1F)
  const dateVal = (((date.getFullYear() - 1980) & 0x7F) << 9)
    | (((date.getMonth() + 1) & 0x0F) << 5)
    | (date.getDate() & 0x1F)
  return { time, dateVal }
}

function writeLocalFileHeader(
  nameBytes: Uint8Array,
  crcVal: number,
  size: number,
  compressedSize: number,
): Uint8Array {
  const dt = makeDosDateTime(new Date())
  const buf = new ArrayBuffer(30 + nameBytes.length)
  const view = new DataView(buf)
  view.setUint32(0, 0x04034B50, true)   // signature
  view.setUint16(4, 20, true)           // version needed
  view.setUint16(6, 0, true)            // flags
  view.setUint16(8, 0, true)            // method: STORE
  view.setUint16(10, dt.time, true)     // mod time
  view.setUint16(12, dt.dateVal, true)  // mod date
  view.setUint32(14, crcVal >>> 0, true)    // crc-32
  view.setUint32(18, compressedSize, true)  // compressed size
  view.setUint32(22, size, true)            // uncompressed size
  view.setUint16(26, nameBytes.length, true)// name length
  view.setUint16(28, 0, true)              // extra field length
  new Uint8Array(buf).set(nameBytes, 30)
  return new Uint8Array(buf)
}

function writeCentralDirectoryEntry(
  nameBytes: Uint8Array,
  crcVal: number,
  size: number,
  compressedSize: number,
  offset: number,
): Uint8Array {
  const dt = makeDosDateTime(new Date())
  const buf = new ArrayBuffer(46 + nameBytes.length)
  const view = new DataView(buf)
  view.setUint32(0, 0x02014B50, true)   // signature
  view.setUint16(4, 20, true)           // version made by
  view.setUint16(6, 20, true)           // version needed
  view.setUint16(8, 0, true)            // flags
  view.setUint16(10, 0, true)           // method: STORE
  view.setUint16(12, dt.time, true)
  view.setUint16(14, dt.dateVal, true)
  view.setUint32(16, crcVal >>> 0, true)
  view.setUint32(20, compressedSize, true)
  view.setUint32(24, size, true)
  view.setUint16(28, nameBytes.length, true)
  view.setUint16(30, 0, true)  // extra field
  view.setUint16(32, 0, true)  // comment
  view.setUint16(34, 0, true)  // disk number
  view.setUint16(36, 0, true)  // internal attrs
  view.setUint32(38, 0, true)  // external attrs
  view.setUint32(42, offset, true) // relative offset
  new Uint8Array(buf).set(nameBytes, 46)
  return new Uint8Array(buf)
}

function writeEndOfCentralDirectory(
  entryCount: number,
  cdSize: number,
  cdOffset: number,
): Uint8Array {
  const buf = new ArrayBuffer(22)
  const view = new DataView(buf)
  view.setUint32(0, 0x06054B50, true)
  view.setUint16(4, 0, true)       // disk number
  view.setUint16(6, 0, true)       // CD disk
  view.setUint16(8, entryCount, true)
  view.setUint16(10, entryCount, true)
  view.setUint32(12, cdSize, true)
  view.setUint32(16, cdOffset, true)
  view.setUint16(20, 0, true)      // comment length
  return new Uint8Array(buf)
}

export interface ZipItem {
  /** ZIP 内的文件夹名 */
  folder: string
  /** 录音的 provider key（用于从 historyProvider 读取） */
  fileKey: string
  /** 附带的 JSON 元数据 */
  infoJson?: string
  /** webm 文件名 */
  webmName: string
}

/**
 * 流式 ZIP 打包下载 — 逐个文件从 Provider 读取并直接写入下载流
 *
 * 整个过程中 JS 堆只保存当前正在处理的那一个文件的数据，
 * 不会像 jszip 一样把所有文件加载到内存。
 *
 * @param items 要打包的文件列表
 * @param outputName ZIP 文件名
 * @param fileProvider 用于读取音频文件的 IFileProvider
 * @param onProgress 进度回调
 */
export async function streamingZipDownload(
  items: ZipItem[],
  outputName: string,
  fileProvider: IFileProvider,
  onProgress?: (percent: number, currentFile: string) => void,
): Promise<void> {
  const writer = saver.createWriteStream(outputName).getWriter()
  const encoder = textEncoder()
  const centralEntries: Uint8Array[] = []
  let offset = 0

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx]

    if (onProgress) {
      onProgress(Math.round((idx / items.length) * 100), item.webmName)
    }

    // ── 写入 webm 文件 ──
    const webmPath = `${item.folder}/${item.webmName}`
    const webmNameBytes = encoder.encode(webmPath)

    const blob = await fileProvider.getFileBlob(item.fileKey)
    const blobData = new Uint8Array(await blob.arrayBuffer())

    const blobCrc = crc32(blobData) ^ 0xFFFFFFFF
    const localHeader = writeLocalFileHeader(webmNameBytes, blobCrc, blobData.length, blobData.length)
    await writer.write(localHeader)
    await writer.write(blobData)

    centralEntries.push(
      writeCentralDirectoryEntry(webmNameBytes, blobCrc, blobData.length, blobData.length, offset),
    )
    offset += localHeader.length + blobData.length

    // ── 写入 JSON 信息文件 ──
    if (item.infoJson) {
      const jsonPath = `${item.folder}/${item.folder}.json`
      const jsonNameBytes = encoder.encode(jsonPath)
      const jsonData = encoder.encode(item.infoJson)
      const jsonCrc = crc32(jsonData) ^ 0xFFFFFFFF
      const jsonHeader = writeLocalFileHeader(jsonNameBytes, jsonCrc, jsonData.length, jsonData.length)
      await writer.write(jsonHeader)
      await writer.write(jsonData)
      centralEntries.push(
        writeCentralDirectoryEntry(jsonNameBytes, jsonCrc, jsonData.length, jsonData.length, offset),
      )
      offset += jsonHeader.length + jsonData.length
    }
  }

  // ── 写入中央目录 ──
  const cdOffset = offset
  let cdSize = 0
  for (const entry of centralEntries) {
    await writer.write(entry)
    cdSize += entry.length
  }

  // ── 写入结束记录 ──
  const eocd = writeEndOfCentralDirectory(centralEntries.length, cdSize, cdOffset)
  await writer.write(eocd)

  await writer.close()

  if (onProgress) {
    onProgress(100, '完成')
  }
}
