function createAnimationFrames() {
  let id = 0;
  const frames = new Map();

  return {
    request(callback) {
      frames.set(++id, callback);
      return id;
    },
    cancel(frame) {
      frames.delete(frame);
    },
    flush() {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback());
    },
    reset() {
      frames.clear();
      id = 0;
    },
  };
}

module.exports = { createAnimationFrames };
