import { deflate, inflate } from './deflate';
import { MAX_BACKUP_BYTES } from './index';
import { ensureValid } from './readers';

const encoder = new TextEncoder();
const filename = encoder.encode('yongplanner-backup.json');
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => crcEntry(index));

function crcEntry(value: number): number {
  let crc = value;

  for (let i = 0; i < 8; i++) {
    crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }

  return crc >>> 0;
}

function checksum(input: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of input) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255]!;
  }

  return (crc ^ 0xffffffff) >>> 0;
}

export function zipJson(json: string): Uint8Array {
  const input = encoder.encode(json);
  const validSize = input.length <= MAX_BACKUP_BYTES;

  ensureValid(validSize, '백업 파일은 압축 전 50MB 이하여야 합니다.');
  const deflated = deflate(input);
  const smaller = deflated.length < input.length;
  const compressed = smaller ? deflated : input;
  const method = smaller ? 8 : 0;
  const localSize = 30 + filename.length + compressed.length;
  const centralSize = 46 + filename.length;
  const output = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(output.buffer);
  const crc = checksum(input);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x800, true);
  view.setUint16(8, method, true);
  view.setUint16(12, 33, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, compressed.length, true);
  view.setUint32(22, input.length, true);
  view.setUint16(26, filename.length, true);
  output.set(filename, 30);
  output.set(compressed, 30 + filename.length);
  view.setUint32(localSize, 0x02014b50, true);
  view.setUint16(localSize + 4, 20, true);
  output.set(output.subarray(4, 30), localSize + 6);
  output.set(filename, localSize + 46);
  const end = localSize + centralSize;

  view.setUint32(end, 0x06054b50, true);
  view.setUint16(end + 8, 1, true);
  view.setUint16(end + 10, 1, true);
  view.setUint32(end + 12, centralSize, true);
  view.setUint32(end + 16, localSize, true);

  return output;
}

function endOfDirectory(view: DataView): number {
  const minimum = Math.max(0, view.byteLength - 65557);

  for (let at = view.byteLength - 22; at >= minimum; at--) {
    const matches =
      view.getUint32(at, true) === 0x06054b50 &&
      at + 22 + view.getUint16(at + 20, true) === view.byteLength;

    if (matches) {
      return at;
    }
  }
  throw new Error('올바른 ZIP 백업이 아닙니다.');
}

export function unzipJson(bytes: Uint8Array): string {
  const validSize = bytes.length >= 22 && bytes.length <= MAX_BACKUP_BYTES + 1024 * 1024;

  ensureValid(validSize, 'ZIP 백업의 크기가 올바르지 않습니다.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = endOfDirectory(view);
  const singleFile =
    view.getUint16(end + 8, true) === 1 &&
    view.getUint16(end + 10, true) === 1 &&
    view.getUint32(end + 4, true) === 0;

  ensureValid(singleFile, '하나의 JSON 파일이 들어 있는 전체 ZIP 백업을 선택해 주세요.');
  const central = view.getUint32(end + 16, true);
  const validCentral = central + 46 <= end && view.getUint32(central, true) === 0x02014b50;

  ensureValid(validCentral, 'ZIP 백업의 목록이 올바르지 않습니다.');

  return readEntry(bytes, view, central);
}

function readEntry(bytes: Uint8Array, view: DataView, central: number): string {
  const method = view.getUint16(central + 10, true);
  const size = view.getUint32(central + 24, true);
  const packed = view.getUint32(central + 20, true);
  const local = view.getUint32(central + 42, true);
  const nameLength = view.getUint16(central + 28, true);
  const name = new TextDecoder().decode(bytes.subarray(central + 46, central + 46 + nameLength));
  const valid =
    size <= MAX_BACKUP_BYTES &&
    (view.getUint16(central + 8, true) & 1) === 0 &&
    /\.json$/i.test(name);

  ensureValid(valid, '지원하지 않는 ZIP 백업이거나 압축 전 크기가 50MB를 초과합니다.');
  const content = readPayload(bytes, view, central, local, packed, method, size);
  const intact =
    content.length === size && checksum(content) === view.getUint32(central + 16, true);

  ensureValid(intact, 'ZIP 백업이 손상되었습니다.');

  return new TextDecoder('utf-8', { fatal: true }).decode(content);
}

function readPayload(
  bytes: Uint8Array,
  view: DataView,
  central: number,
  local: number,
  packed: number,
  method: number,
  size: number,
) {
  const validLocal = local + 30 <= central && view.getUint32(local, true) === 0x04034b50;

  ensureValid(validLocal, 'ZIP 백업의 파일 정보가 올바르지 않습니다.');
  const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
  const validPayload = start + packed <= central && (method === 0 || method === 8);

  ensureValid(validPayload, '지원하지 않는 ZIP 압축 형식입니다.');
  const payload = bytes.subarray(start, start + packed);
  const content = method === 8 ? inflate(payload, size) : payload;

  return content;
}
