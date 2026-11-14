// RFC 1951 fixed-Huffman compression; the decoder also accepts dynamic/stored blocks.
import { lengths, lengthBits, distances, distanceBits, fixedLengths } from './deflateTables';
import { codes, reversed, Writer } from './huffman';
export { inflate } from './inflate';

const literalCodes = codes(fixedLengths);

function rangeCode(value: number, bases: number[]) {
  let index = bases.length - 1;

  while (bases[index]! > value) {
    index--;
  }

  return index;
}

function emit(writer: Writer, value: number) {
  writer.bits(literalCodes[value]!, fixedLengths[value]!);
}

function matchLength(input: Uint8Array, at: number, previous: number): number {
  const unavailable = previous < 0 || at - previous > 32768;

  if (unavailable) {
    return 0;
  }
  const maximum = Math.min(258, input.length - at);
  let length = 0;

  while (length < maximum && input[previous + length] === input[at + length]) {
    length++;
  }

  return length;
}

function emitMatch(writer: Writer, length: number, distance: number) {
  const lengthCode = rangeCode(length, lengths);
  const distanceCode = rangeCode(distance, distances);

  emit(writer, 257 + lengthCode);
  writer.bits(length - lengths[lengthCode]!, lengthBits[lengthCode]!);
  writer.bits(reversed(distanceCode, 5), 5);
  writer.bits(distance - distances[distanceCode]!, distanceBits[distanceCode]!);
}

function token(input: Uint8Array, at: number, last: Int32Array, writer: Writer) {
  const key = ((input[at]! * 251 + (input[at + 1] ?? 0)) * 251 + (input[at + 2] ?? 0)) & 65535;
  const previous = last[key]!;
  const length = matchLength(input, at, previous);
  const literal = length < 3;

  last[key] = at;
  if (literal) {
    emit(writer, input[at]!);

    return at + 1;
  }
  emitMatch(writer, length, at - previous);

  return at + length;
}

export function deflate(input: Uint8Array): Uint8Array {
  const writer = new Writer();
  const last = new Int32Array(65536).fill(-1);

  writer.bits(3, 3);
  for (let at = 0; at < input.length; ) {
    at = token(input, at, last, writer);
  }
  emit(writer, 256);

  return writer.finish();
}
