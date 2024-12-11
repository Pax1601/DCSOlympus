import { useCallback, useEffect, useState } from "react";

export const useDrag = (props: { ref, initialPosition, count}) => {
  const [finalPosition, setFinalPosition] = useState({ x: props.initialPosition.x, y: props.initialPosition.y });
  const [isDragging, setIsDragging] = useState(false);
  const [count, setCount] = useState(0)

  if (count !== props.count) {
    setCount(props.count)
    setFinalPosition({ x: props.initialPosition.x, y: props.initialPosition.y })
  }

  const handleMouseUp = (evt) => {
    evt.preventDefault();

    setIsDragging(false);
  };

  const handleMouseDown = (evt) => {
    evt.preventDefault();

    const { current: draggableElement } = props.ref;

    if (!draggableElement) {
      return;
    }

    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (evt) => {
      const { current: draggableElement } = props.ref;

      if (!isDragging || !draggableElement) return;

      evt.preventDefault();

      const parentRect = draggableElement.parentElement.getBoundingClientRect();
      const rect = draggableElement.getBoundingClientRect();

      const [width, height] = [rect.width, rect.height];
      const [mouseX, mouseY] = [evt.clientX, evt.clientY];
      const [parentTop, parentLeft, parentWidth, parentHeight] = [parentRect.top, parentRect.left, parentRect.width, parentRect.height];

      setFinalPosition({
        x: Math.round(Math.max(width / 2, Math.min(mouseX - parentLeft, parentWidth - width / 2)) / 10) * 10,
        y: Math.round(Math.max(height / 2, Math.min(mouseY - parentTop, parentHeight - height / 2)) / 10) * 10,
      });
    },
    [isDragging, props.ref]
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove]);

  return {
    position: finalPosition,
    handleMouseDown
  };
};
