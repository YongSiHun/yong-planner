import { lengths, lengthBits, distances, distanceBits, fixedLengths } from './deflateTables';
import { Reader, tree, symbol, type Tree } from './huffman';

type Trees = [Tree, Tree];
const fixedTrees: Trees = [tree(fixedLengths), tree(new Array<number>(32).fill(5))];

class Output {
  readonly bytes: Uint8Array;
  private at = 0;

  constructor(size: number) {
    this.bytes = new Uint8Array(size);
  }

  put(value: number) {
    const full = this.at >= this.bytes.length;

    if (full) {
      throw new Error('압축 해제 크기가 올바르지 않습니다.');
    }
    this.bytes[this.at++] = value;
  }

  copy(distance: number, count: number) {
    const invalid = distance > this.at;

    if (invalid) {
      throw new Error('잘못된 압축 거리입니다.');
    }
    for (let i = 0; i < count; i++) {
      this.put(this.bytes[this.at - distance]!);
    }
  }

  finish() {
    const incomplete = this.at !== this.bytes.length;

    if (incomplete) {
      throw new Error('압축 해제 크기가 올바르지 않습니다.');
    }

    return this.bytes;
  }
}

function repeatCount(reader: Reader, value: number) {
  const previous = value === 16;
  const short = value === 17;

  if (previous) {
    return reader.bits(2) + 3;
  }
  if (short) {
    return reader.bits(3) + 3;
  }

  return reader.bits(7) + 11;
}

function appendCode(reader: Reader, codeTree: Tree, all: number[]) {
  const value = symbol(reader, codeTree);
  const literal = value < 16;

  if (literal) {
    all.push(value);

    return;
  }
  const invalidRepeat = value === 16 && all.length === 0;

  if (invalidRepeat) {
    throw new Error('잘못된 압축 반복입니다.');
  }
  const count = repeatCount(reader, value);

  appendRepeat(all, value, count);
}

function dynamicSizes(reader: Reader, count: number): number[] {
  const codeCount = reader.bits(4) + 4;
  const order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  const sizes = new Array<number>(19).fill(0);

  for (let i = 0; i < codeCount; i++) {
    sizes[order[i]!] = reader.bits(3);
  }
  const codeTree = tree(sizes);
  const all: number[] = [];

  while (all.length < count) {
    appendCode(reader, codeTree, all);
  }
  const invalid = all.length !== count || all[256] === 0;

  if (invalid) {
    throw new Error('잘못된 압축 코드 길이입니다.');
  }

  return all;
}

function dynamicTrees(reader: Reader): Trees {
  const literalCount = reader.bits(5) + 257;
  const distanceCount = reader.bits(5) + 1;
  const sizes = dynamicSizes(reader, literalCount + distanceCount);

  return [tree(sizes.slice(0, literalCount)), tree(sizes.slice(literalCount))];
}

function copyMatch(reader: Reader, distanceTree: Tree, index: number, output: Output) {
  const invalidLength = index >= lengths.length;

  if (invalidLength) {
    throw new Error('잘못된 압축 길이입니다.');
  }
  const count = lengths[index]! + reader.bits(lengthBits[index]!);
  const distanceCode = symbol(reader, distanceTree);
  const invalidDistance = distanceCode >= distances.length;

  if (invalidDistance) {
    throw new Error('잘못된 압축 거리입니다.');
  }
  output.copy(distances[distanceCode]! + reader.bits(distanceBits[distanceCode]!), count);
}

function decodeToken(reader: Reader, trees: Trees, output: Output): boolean {
  const value = symbol(reader, trees[0]);
  const end = value === 256;
  const literal = value < 256;

  if (end) {
    return false;
  }
  if (literal) {
    output.put(value);

    return true;
  }
  copyMatch(reader, trees[1], value - 257, output);

  return true;
}

function storedBlock(reader: Reader, output: Output) {
  reader.align();
  const count = reader.bits(16);
  const invalid = (count ^ reader.bits(16)) !== 65535;

  if (invalid) {
    throw new Error('잘못된 압축 블록입니다.');
  }
  for (let i = 0; i < count; i++) {
    output.put(reader.bits(8));
  }
}

function block(reader: Reader, output: Output): boolean {
  const final = reader.bits(1) === 1;
  const kind = reader.bits(2);
  const stored = kind === 0;
  const invalid = kind === 3;

  if (stored) {
    storedBlock(reader, output);

    return final;
  }
  if (invalid) {
    throw new Error('지원하지 않는 압축 블록입니다.');
  }
  const trees = kind === 1 ? fixedTrees : dynamicTrees(reader);

  while (decodeToken(reader, trees, output)) {
    /* Decode until the end-of-block symbol. */
  }

  return final;
}

export function inflate(input: Uint8Array, expectedSize: number): Uint8Array {
  const output = new Output(expectedSize);
  const reader = new Reader(input);
  let final = false;

  while (!final) {
    final = block(reader, output);
  }

  return output.finish();
}

function appendRepeat(all: number[], value: number, count: number) {
  const previous = value === 16 ? all[all.length - 1]! : 0;

  for (let i = 0; i < count; i++) {
    all.push(previous);
  }
}
