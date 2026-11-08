import { Animated, PanResponder, type LayoutChangeEvent } from 'react-native';
import { dropBoundary, type ChipBounds } from '../services/dragGeometry';

export type ChipDragSnapshot = { index: number; box: ChipBounds } | null;

export class ChipDragSession {
  readonly offset = new Animated.ValueXY();
  readonly boxes = new Map<number, ChipBounds>();
  onMove?: (from: number, boundary: number) => void;
  private armed: number | null = null;
  private moving: number | null = null;
  readonly pan = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      this.armed !== null && Math.hypot(gesture.dx, gesture.dy) > 8,
    onPanResponderGrant: () => this.begin(),
    onPanResponderMove: (_, gesture) => this.offset.setValue({ x: gesture.dx, y: gesture.dy }),
    onPanResponderRelease: (_, gesture) => this.finish(gesture.dx, gesture.dy),
    onPanResponderTerminate: () => this.cancel(),
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  });

  constructor(private publish: (snapshot: ChipDragSnapshot) => void) {}

  setCount(count: number) {
    this.boxes.forEach((_, index) => {
      const stale = index >= count;

      if (stale) {
        this.boxes.delete(index);
      }
    });
  }

  setOnMove(onMove: (from: number, boundary: number) => void) {
    this.onMove = onMove;
  }

  record = (index: number, event: LayoutChangeEvent) => {
    this.boxes.set(index, event.nativeEvent.layout);
  };
  arm = (index: number) => {
    this.armed = index;
  };
  releaseArm = () => {
    this.armed = null;
  };

  private begin() {
    const index = this.armed;
    const box = index === null ? undefined : this.boxes.get(index);
    const canBegin = index !== null && box !== undefined;

    if (!canBegin) {
      return;
    }
    this.moving = index;
    this.offset.setValue({ x: 0, y: 0 });
    this.publish({ index, box });
  }

  private finish(dx: number, dy: number) {
    const source = this.moving;
    const box = source === null ? undefined : this.boxes.get(source);
    const canDrop = source !== null && box !== undefined;

    if (!canDrop) {
      this.cancel();

      return;
    }
    const target = dropBoundary(
      this.boxes,
      box.x + box.width / 2 + dx,
      box.y + box.height / 2 + dy,
    );
    const hasTarget = target !== null;

    if (hasTarget) {
      this.onMove?.(source, target);
    }
    this.cancel();
  }

  cancel = () => {
    this.armed = null;
    this.moving = null;
    this.offset.setValue({ x: 0, y: 0 });
    this.publish(null);
  };
}
