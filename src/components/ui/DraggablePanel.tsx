import type { ReactNode } from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';

interface DraggablePanelProps {
  title: string;
  initialX: number;
  initialY: number;
  initialWidth?: number;
  initialHeight?: number;
  children: ReactNode;
  onClose?: () => void;
}

const MIN_WIDTH = 240;
const MIN_HEIGHT = 160;

export const DraggablePanel = ({
  title,
  initialX,
  initialY,
  initialWidth = 280,
  initialHeight = 260,
  children,
  onClose,
}: DraggablePanelProps) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight,
  });
  const draggingRef = useRef(false);
  const resizingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({
    x: 0,
    y: 0,
    width: initialWidth,
    height: initialHeight,
  });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (draggingRef.current) {
      setPosition({
        x: event.clientX - offsetRef.current.x,
        y: event.clientY - offsetRef.current.y,
      });
    } else if (resizingRef.current) {
      const deltaX = event.clientX - resizeStartRef.current.x;
      const deltaY = event.clientY - resizeStartRef.current.y;
      setSize({
        width: Math.max(MIN_WIDTH, resizeStartRef.current.width + deltaX),
        height: Math.max(MIN_HEIGHT, resizeStartRef.current.height + deltaY),
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
    resizingRef.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      offsetRef.current = {
        x: event.clientX - position.x,
        y: event.clientY - position.y,
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp, { once: true });
    },
    [handleMouseMove, handleMouseUp, position.x, position.y],
  );

  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      resizingRef.current = true;
      resizeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        width: size.width,
        height: size.height,
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp, { once: true });
    },
    [handleMouseMove, handleMouseUp, size.height, size.width],
  );

  useEffect(
    () => () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    },
    [handleMouseMove, handleMouseUp],
  );

  return (
    <div
      className="draggable-panel"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      <div className="draggable-panel__header" onMouseDown={handleMouseDown}>
        <span>{title}</span>
        {onClose ? (
          <button
            className="draggable-panel__close"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClose}
            aria-label={`Chiudi ${title}`}
          >
            X
          </button>
        ) : null}
      </div>
      <div className="draggable-panel__content">{children}</div>
      <div
        className="draggable-panel__resize"
        onMouseDown={handleResizeMouseDown}
        aria-label={`Ridimensiona ${title}`}
      />
    </div>
  );
};
