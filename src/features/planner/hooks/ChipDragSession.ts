import { Animated, PanResponder, type LayoutChangeEvent } from 'react-native';
import { dropTarget, type ChipBounds, type ChipDropTarget } from '../services/dragGeometry';

export type ChipDragSnapshot = { index: number; box: ChipBounds } | null;

export class ChipDragSession {
  readonly offset = new Animated.ValueXY();
  readonly markerOffset = new Animated.ValueXY();
  readonly markerHeight = new Animated.Value(0);
  private target: ChipDropTarget | null = null;
  readonly boxes = new Map<number, ChipBounds>();
  onMove?: (from: number, boundary: number) => void;
  private armed: number | null = null;
  private moving: number | null = null;
  readonly pan = PanResponder.create({
    // Long press 후 첫 이동부터 캡처: ScrollView 선점 방지.
    onMoveShouldSetPanResponderCapture: () => this.armed !== null && this.canDrag(this.armed),
    onPanResponderGrant: () => this.begin(),
    onPanResponderMove: (_, gesture) => this.move(gesture.dx, gesture.dy),
    onPanResponderRelease: (_, gesture) => this.finish(gesture.dx, gesture.dy),
    onPanResponderTerminate: () => this.cancel(),
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  });

  constructor(
    private publish: (snapshot: ChipDragSnapshot) => void,
    private canDrag: (index: number) => boolean = () => true,
  ) {}

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
    this.armed = this.canDrag(index) ? index : null;
  };
  releaseArm = () => {
    this.armed = null;
  };

  private begin() {
    const index = this.armed;
    const box = index === null ? undefined : this.boxes.get(index);
    const canBegin = index !== null && box !== undefined && this.canDrag(index);

    if (!canBegin) {
      return;
    }
    this.moving = index;
    this.offset.setValue({ x: 0, y: 0 });
    this.updateTarget(box, 0, 0);
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
    this.updateTarget(box, dx, dy);
    this.commit(source, this.target);
    this.cancel();
  }

  private commit(source: number, target: ChipDropTarget | null) {
    const shouldMove = target !== null && this.canDrag(source);

    if (shouldMove) {
      this.onMove?.(source, target.boundary);
    }
  }

  private move(dx: number, dy: number) {
    const box = this.moving === null ? undefined : this.boxes.get(this.moving);
    const hasBox = box !== undefined && this.moving !== null && this.canDrag(this.moving);

    if (!hasBox) {
      return;
    }
    this.offset.setValue({ x: dx, y: dy });
    this.updateTarget(box, dx, dy);
  }

  private updateTarget(box: ChipBounds, dx: number, dy: number) {
    const next = dropTarget(this.boxes, box.x + box.width / 2 + dx, box.y + box.height / 2 + dy);
    const unchanged = sameTarget(this.target, next);

    if (unchanged) {
      return;
    }
    this.target = next;
    if (!next) {
      this.markerHeight.setValue(0);

      return;
    }
    // 경계 변경 시 Animated 값만 갱신.
    this.markerOffset.setValue({ x: next.x, y: next.y });
    this.markerHeight.setValue(next.height);
  }

  cancel = () => {
    this.armed = null;
    this.moving = null;
    this.target = null;
    this.markerHeight.setValue(0);
    this.offset.setValue({ x: 0, y: 0 });
    this.publish(null);
  };
}

function sameTarget(before: ChipDropTarget | null, after: ChipDropTarget | null): boolean {
  return (
    before?.boundary === after?.boundary &&
    before?.x === after?.x &&
    before?.y === after?.y &&
    before?.height === after?.height
  );
}
