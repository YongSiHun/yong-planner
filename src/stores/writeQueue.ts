export class WriteQueue {
  private tail: Promise<void> = Promise.resolve();
  enqueue(task: () => Promise<void>): Promise<void> {
    const result = this.tail.then(task);
    this.tail = result.catch(() => {});
    return result;
  }
}
