import { useState } from 'react';
import { useWindowDimensions, type LayoutChangeEvent, type TextLayoutEvent } from 'react-native';
import { design } from '../../../components/ui/tokens';
import { measureInputLines, reserveInputWidth } from '../services/inputGeometry';

const metrics = {
  fontSize: design.type.body,
  lineHeight: design.lineHeight,
  minimumHeight: design.rowMinHeight,
  widthStep: design.space.lg * 2,
};

export function useInputGeometry({
  content,
  initiallyEmpty,
  getContent,
}: {
  content: string;
  initiallyEmpty: boolean;
  getContent(): string;
}) {
  const { height: windowHeight, width: windowWidth, fontScale } = useWindowDimensions();
  const scale = fontScale ?? 1;
  const maximumHeight = Math.max(80, Math.min(240, windowHeight * 0.32));
  const minimumHeight = Math.max(metrics.minimumHeight, metrics.lineHeight * scale + 8);
  const [height, setHeight] = useState(minimumHeight);
  const [availableWidth, setAvailableWidth] = useState(Math.max(30, windowWidth - 68));
  const [reservedWidth, setReservedWidth] = useState(() =>
    initiallyEmpty ? Math.max(30, windowWidth - 68) : reserveInputWidth(content, scale, metrics),
  );

  function resize(nextContent: string, reset: boolean) {
    const width = reserveInputWidth(nextContent, scale, metrics);

    if (reset) {
      setHeight(minimumHeight);
      setReservedWidth(width);

      return;
    }
    setReservedWidth((previous) => Math.max(previous, width));
  }

  function handleTextLayout(event: TextLayoutEvent) {
    const isCurrent = getContent() === content;

    if (!isCurrent) {
      return;
    }
    const size = measureInputLines(event.nativeEvent.lines, scale, metrics);

    setHeight(size.height);
    setReservedWidth((previous) => Math.max(previous, size.width));
  }

  function handleFlowLayout(event: LayoutChangeEvent) {
    setAvailableWidth(Math.max(30, event.nativeEvent.layout.width - 10));
  }

  return {
    height,
    maximumHeight,
    availableWidth,
    inputWidth: Math.min(availableWidth, reservedWidth),
    resize,
    handleTextLayout,
    handleFlowLayout,
  };
}
