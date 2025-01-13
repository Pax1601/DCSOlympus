import { useCallback, useEffect, useState } from "react";

export const useDrag = (props: { ref, initialPosition, count}) => {
  const [position, setPosition] = useState({ x: props.initialPosition.x, y: props.initialPosition.y });
  const [dragging, isDragging] = useState(false);
  const [count, setCount] = useState(0)

  if (count !== props.count) {
    setCount(props.count)
    setPosition({ x: props.initialPosition.x, y: props.initialPosition.y })
  }

  const handleMouseUp = (evt) => {
    evt.preventDefault();

    isDragging(false);
  };

  const handleMouseDown = (evt) => {
    evt.preventDefault();

    const { current: draggableElement } = props.ref;

    if (!draggableElement) {
      return;
    }

    isDragging(true);
  };

  const handleMouseMove = useCallback(
    (evt) => {
      const { current: draggableElement } = props.ref;

      if (!dragging || !draggableElement) return;

      evt.preventDefault();

      const parentRect = draggableElement.parentElement.getBoundingClientRect();
      const rect = draggableElement.getBoundingClientRect();

      const [width, height] = [rect.width, rect.height];
      const [mouseX, mouseY] = [evt.clientX, evt.clientY];
      const [parentTop, parentLeft, parentWidth, parentHeight] = [parentRect.top, parentRect.left, parentRect.width, parentRect.height];

      setPosition({
        x: Math.max(width / 2, Math.min(mouseX - parentLeft, parentWidth - width / 2)),
        y: Math.max(height / 2, Math.min(mouseY - parentTop, parentHeight - height / 2)),
      });
    },
    [dragging, props.ref]
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove]);

  const forcePosition = (x, y) => {
    setPosition({x, y});
  }

  return {
    position: position,
    handleMouseDown,
    forcePosition
  };
};
