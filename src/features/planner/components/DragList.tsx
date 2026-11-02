import { useCallback, useMemo, type ReactNode } from 'react';
import { PanResponder, ScrollView, Text, View, type LayoutChangeEvent } from 'react-native';
import { useTheme } from '../../../components/ui';
import { useDragList } from '../hooks/useDragList';
import type { DragVisual } from '../services/drag';

interface DragListProps<T> {
  items: T[];
  id(item: T): string;
  render(item: T): ReactNode;
  onOrder(items: T[]): void;
  footer?: ReactNode;
}

interface DragHandleProps {
  onStart(): void;
  onMove(pointer: number, delta: number): void;
  onEnd(): void;
  onCancel(): void;
  onAccessibleMove(direction: number): void;
}

function DragHandle({ onStart, onMove, onEnd, onCancel, onAccessibleMove }: DragHandleProps) {
  const theme = useTheme();
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: onStart,
        onPanResponderMove: (_, gesture) => onMove(gesture.moveY, gesture.dy),
        onPanResponderRelease: onEnd,
        onPanResponderTerminate: onCancel,
        onPanResponderTerminationRequest: () => false,
      }),
    [onStart, onMove, onEnd, onCancel],
  );

  return (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="일정 순서 변경"
      accessibilityHint="위아래로 드래그하거나 접근성 동작을 사용하세요"
      accessibilityActions={[
        { name: 'increment', label: '아래로 이동' },
        { name: 'decrement', label: '위로 이동' },
      ]}
      onAccessibilityAction={(event) =>
        onAccessibleMove(event.nativeEvent.actionName === 'increment' ? 1 : -1)
      }
      style={{ width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: theme.muted, fontSize: 23 }}>☰</Text>
    </View>
  );
}

interface DragRowHandlers {
  handleStart(index: number): void;
  handleMove(pointer: number, delta: number): void;
  handleEnd(): void;
  handleCancel(): void;
  handleAccessibleMove(index: number, direction: number): void;
  handleRowLayout(id: string, event: LayoutChangeEvent): void;
}

function DragRow<T>({
  item,
  index,
  visual,
  render,
  itemId,
  handlers,
}: {
  item: T;
  index: number;
  visual: DragVisual | null;
  render(item: T): ReactNode;
  itemId: string;
  handlers: DragRowHandlers;
}) {
  const theme = useTheme();
  const isActive = visual?.index === index;
  const isTarget = visual?.target === index;
  const translation = isActive ? visual!.dy : 0;
  const { handleStart, handleAccessibleMove } = handlers;

  const handleDragStart = useCallback(() => handleStart(index), [handleStart, index]);
  const handleAccessibleDrag = useCallback(
    (direction: number) => handleAccessibleMove(index, direction),
    [handleAccessibleMove, index],
  );

  return (
    <View
      onLayout={(event) => handlers.handleRowLayout(itemId, event)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isActive ? theme.selected : theme.bg,
        borderTopWidth: 2,
        borderTopColor: isTarget ? theme.accent : 'transparent',
        zIndex: isActive ? 2 : 0,
        transform: [{ translateY: translation }],
      }}
    >
      <DragHandle
        onStart={handleDragStart}
        onMove={handlers.handleMove}
        onEnd={handlers.handleEnd}
        onCancel={handlers.handleCancel}
        onAccessibleMove={handleAccessibleDrag}
      />
      <View style={{ flex: 1, paddingVertical: 5 }}>{render(item)}</View>
    </View>
  );
}

export function DragList<T>({ items, id, render, onOrder, footer }: DragListProps<T>) {
  const {
    rootRef,
    scrollRef,
    visual,
    isDragging,
    handleMeasure,
    handleStart,
    handleMove,
    handleEnd,
    handleCancel,
    handleAccessibleMove,
    handleRowLayout,
    handleScroll,
    handleContentSizeChange,
  } = useDragList(items, id, onOrder);
  const handlers = {
    handleStart,
    handleMove,
    handleEnd,
    handleCancel,
    handleAccessibleMove,
    handleRowLayout,
  };

  return (
    <View ref={rootRef} style={{ flexShrink: 1, minHeight: 70 }} onLayout={handleMeasure}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isDragging}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {items.map((item, index) => (
          <DragRow
            key={id(item)}
            itemId={id(item)}
            item={item}
            index={index}
            visual={visual}
            handlers={handlers}
            render={render}
          />
        ))}
        {footer}
      </ScrollView>
    </View>
  );
}
