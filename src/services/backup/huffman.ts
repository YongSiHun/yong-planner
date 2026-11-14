function reversed(value: number, count: number) {
  let result = 0;

  for (let i = 0; i < count; i++) {
    result = (result << 1) | ((value >>> i) & 1);
  }

  return result;
}

export { reversed };

export function codes(sizes: number[]) {
  const counts = new Array<number>(16).fill(0);
  const next = new Array<number>(16).fill(0);

  sizes.forEach((size) => {
    const hasCode = size > 0;

    if (hasCode) {
      counts[size] = counts[size]! + 1;
    }
  });
  for (let i = 1; i <= 15; i++) {
    next[i] = (next[i - 1]! + counts[i - 1]!) << 1;
    const oversubscribed = next[i]! + counts[i]! > 1 << i;

    if (oversubscribed) {
      throw new Error('잘못된 압축 코드입니다.');
    }
  }

  return sizes.map((size) => (size === 0 ? 0 : reversed(next[size]!++, size)));
}

export class Writer {
  private output = new Uint8Array(65536);
  private at = 0;
  private buffer = 0;
  private count = 0;

  bits(value: number, size: number) {
    this.buffer |= value << this.count;
    this.count += size;
    while (this.count >= 8) {
      this.write(this.buffer & 255);
      this.buffer >>>= 8;
      this.count -= 8;
    }
  }

  private write(value: number) {
    const full = this.at === this.output.length;

    if (full) {
      const expanded = new Uint8Array(this.output.length * 2);

      expanded.set(this.output);
      this.output = expanded;
    }
    this.output[this.at++] = value;
  }

  finish() {
    const remaining = this.count > 0;

    if (remaining) {
      this.write(this.buffer & 255);
    }

    return this.output.slice(0, this.at);
  }
}

export class Reader {
  private bit = 0;

  constructor(private input: Uint8Array) {}

  bits(size: number) {
    const truncated = this.bit + size > this.input.length * 8;

    if (truncated) {
      throw new Error('압축 파일이 잘렸습니다.');
    }
    let value = 0;

    for (let i = 0; i < size; i++) {
      value |= ((this.input[this.bit >>> 3]! >>> (this.bit & 7)) & 1) << i;
      this.bit++;
    }

    return value;
  }

  align() {
    this.bit = Math.ceil(this.bit / 8) * 8;
  }
}

export type Tree = Map<number, number>;

export function tree(sizes: number[]): Tree {
  const values = codes(sizes);
  const result: Tree = new Map();

  sizes.forEach((size, symbol) => {
    const hasCode = size > 0;

    if (hasCode) {
      result.set((1 << size) | values[symbol]!, symbol);
    }
  });

  return result;
}

export function symbol(reader: Reader, table: Tree): number {
  let value = 0;

  for (let size = 1; size <= 15; size++) {
    value |= reader.bits(1) << (size - 1);
    const result = table.get((1 << size) | value);
    const found = result !== undefined;

    if (found) {
      return result;
    }
  }
  throw new Error('잘못된 압축 코드입니다.');
}
