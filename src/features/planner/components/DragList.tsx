import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Keyboard,
  PanResponder,
  ScrollView,
  Text,
  View,
  type GestureResponderHandlers,
} from 'react-native';
import { useTheme } from '../../../components/ui';
import { moveEntry } from '../services/plans';
interface Props<T> {
  items: T[];
  id(item: T): string;
  render(item: T): ReactNode;
  onOrder(items: T[]): void;
  footer?: ReactNode;
}
function Handle({
  start,
  move,
  end,
  cancel,
  actions,
}: {
  start(): void;
  move(y: number, dy: number): void;
  end(): void;
  cancel(): void;
  actions(direction: number): void;
}) {
  const t = useTheme();
  const current = useRef({ start, move, end, cancel });
  current.current = { start, move, end, cancel };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => current.current.start(),
      onPanResponderMove: (_, g) => current.current.move(g.moveY, g.dy),
      onPanResponderRelease: () => current.current.end(),
      onPanResponderTerminate: () => current.current.cancel(),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;
  return (
    <View
      {...(responder.panHandlers as GestureResponderHandlers)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="일정 순서 변경"
      accessibilityHint="위아래로 드래그하거나 접근성 동작을 사용하세요"
      accessibilityActions={[
        { name: 'increment', label: '아래로 이동' },
        { name: 'decrement', label: '위로 이동' },
      ]}
      onAccessibilityAction={(e) => actions(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={{ width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: t.muted, fontSize: 23 }}>☰</Text>
    </View>
  );
}
export function DragList<T>({ items, id, render, onOrder, footer }: Props<T>) {
  const t = useTheme();
  const scroll = useRef<ScrollView>(null);
  const root = useRef<View>(null);
  const bounds = useRef({ top: 0, height: 0 });
  const rows = useRef(new Map<string, { y: number; height: number }>());
  const offset = useRef(0);
  const contentHeight = useRef(0);
  const latest = useRef({ items, id, onOrder });
  latest.current = { items, id, onOrder };
  const active = useRef<{
    index: number;
    startOffset: number;
    dy: number;
    pointer: number;
    target: number;
  } | null>(null);
  const [visual, setVisual] = useState<{ index: number; dy: number; target: number } | null>(null);
  const calculate = () => {
    const a = active.current;
    if (!a) return;
    const current = latest.current;
    const row = rows.current.get(current.id(current.items[a.index]!));
    if (!row) return;
    const delta = a.dy + offset.current - a.startOffset;
    const center = row.y + row.height / 2 + delta;
    let target = a.index;
    let distance = Infinity;
    current.items.forEach((item, i) => {
      const r = rows.current.get(current.id(item));
      if (r && Math.abs(r.y + r.height / 2 - center) < distance) {
        distance = Math.abs(r.y + r.height / 2 - center);
        target = i;
      }
    });
    a.target = target;
    setVisual({ index: a.index, dy: delta, target });
  };
  useEffect(() => {
    const interval = setInterval(() => {
      const a = active.current;
      if (!a) return;
      const b = bounds.current;
      const direction = a.pointer < b.top + 50 ? -1 : a.pointer > b.top + b.height - 50 ? 1 : 0;
      if (!direction) return;
      const next = Math.max(
        0,
        Math.min(contentHeight.current - b.height, offset.current + direction * 12),
      );
      if (next !== offset.current) {
        offset.current = next;
        scroll.current?.scrollTo({ y: next, animated: false });
        calculate();
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);
  return (
    <View
      ref={root}
      style={{ flexShrink: 1, minHeight: 70 }}
      onLayout={() =>
        root.current?.measureInWindow((_, y, __, height) => {
          bounds.current = { top: y, height };
        })
      }
    >
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!visual}
        scrollEventThrottle={16}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
        }}
        onContentSizeChange={(_, h) => {
          contentHeight.current = h;
        }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {items.map((item, index) => (
          <View
            key={id(item)}
            onLayout={(e) =>
              rows.current.set(id(item), {
                y: e.nativeEvent.layout.y,
                height: e.nativeEvent.layout.height,
              })
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: visual?.index === index ? t.selected : t.bg,
              borderTopWidth: 2,
              borderTopColor: visual?.target === index ? t.accent : 'transparent',
              zIndex: visual?.index === index ? 2 : 0,
              transform: [{ translateY: visual?.index === index ? visual.dy : 0 }],
            }}
          >
            <Handle
              start={() => {
                Keyboard.dismiss();
                root.current?.measureInWindow((_, y, __, height) => {
                  bounds.current = { top: y, height };
                });
                active.current = {
                  index,
                  startOffset: offset.current,
                  dy: 0,
                  pointer: bounds.current.top + bounds.current.height / 2,
                  target: index,
                };
                setVisual({ index, dy: 0, target: index });
              }}
              move={(pointer, dy) => {
                if (active.current) {
                  active.current.pointer = pointer;
                  active.current.dy = dy;
                  calculate();
                }
              }}
              end={() => {
                const a = active.current;
                active.current = null;
                setVisual(null);
                if (a && a.index !== a.target) onOrder(moveEntry(items, a.index, a.target));
              }}
              cancel={() => {
                active.current = null;
                setVisual(null);
              }}
              actions={(direction) => {
                if (index + direction >= 0 && index + direction < items.length)
                  onOrder(moveEntry(items, index, index + direction));
              }}
            />
            <View style={{ flex: 1, paddingVertical: 5 }}>{render(item)}</View>
          </View>
        ))}
        {footer}
      </ScrollView>
    </View>
  );
}
