import React, { useEffect, useRef, useState } from "react";

export function OlTooltip(props: {
  content: string | JSX.Element | JSX.Element[];
  buttonRef: React.MutableRefObject<null>;
  position?: string;
  relativeToParent?: boolean;
}) {
  const [isTouchscreen, setIsTouchscreen] = useState(false);

  useEffect(() => {
    setIsTouchscreen("ontouchstart" in window);
  }, []);

  var contentRef = useRef(null);

  function setPosition(content: HTMLDivElement, button: HTMLButtonElement) {
    /* Reset the position of the content */
    content.style.left = "0px";
    content.style.top = "0px";
    content.style.height = "";

    button.style.position = "relative";
    button.style.left = "0px";
    button.style.top = "0px";
    

    let parent = button.closest(".ol-panel-container") as HTMLElement;
    if (parent === null) parent = document.body;

    /* Get the position and size of the button and the content elements */
    let [contentXLeft, contentYTop, contentXRight, contentYBottom, contentWidth, contentHeight] = [
      content.getBoundingClientRect().x,
      content.getBoundingClientRect().y,
      content.getBoundingClientRect().x + content.offsetWidth,
      content.getBoundingClientRect().y + content.offsetHeight,
      content.offsetWidth,
      content.offsetHeight,
    ];
    let [buttonXLeft, buttonYTop, buttonXRight, buttonYBottom, buttonWidth, buttonHeight] = [
      button.getBoundingClientRect().x,
      button.getBoundingClientRect().y,
      button.getBoundingClientRect().x + button.offsetWidth,
      button.getBoundingClientRect().y + button.offsetHeight,
      button.offsetWidth,
      button.offsetHeight,
    ];

    /* Limit the maximum height */
    if (contentHeight > 400) {
      contentHeight = 400;
      content.style.height = `${contentHeight}px`;
    }

    /* Compute the horizontal position of the center of the button and the content */
    var contentXCenter = (contentXLeft + contentXRight) / 2;
    var buttonXCenter = (buttonXLeft + buttonXRight) / 2;

    /* Compute the x and y offsets needed to align the button and element horizontally, and to put the content depending on the requested position */
    var offsetX = 0;
    var offsetY = 0;

    if (props.position === undefined || props.position === "below") {
      offsetX = buttonXCenter - contentXCenter;
      offsetY = buttonYBottom - contentYTop + 8;
    } else if (props.position === "above") {
      offsetX = buttonXCenter - contentXCenter;
      offsetY = buttonYTop - contentYTop - contentHeight - 8;
    }
    else if (props.position === "side") {
      offsetX = buttonXRight + 8;
      offsetY = buttonYTop - contentYTop + (buttonHeight - contentHeight) / 2;
    }

    content.style.left = `${offsetX}px`;
    content.style.top = `${offsetY}px`;

    /* Compute the new position of the left and right margins of the content */
    let newContentXLeft = props.relativeToParent ? offsetX : contentXLeft + offsetX;
    let newContentXRight = newContentXLeft + contentWidth;
    let newContentYBottom = props.relativeToParent ? offsetY : contentYBottom + offsetY;

    /* Try and move the content so it is inside the screen */
    if (newContentXLeft < 0) offsetX = 15;
    if (newContentXRight > (props.relativeToParent ? parent.clientWidth : window.innerWidth)) {
      if (props.position === "side") {
        offsetX = buttonXLeft - contentXLeft - contentWidth - 12;
      } else {
        offsetX -= newContentXRight - (props.relativeToParent ? parent.clientWidth : window.innerWidth) + 15;
      }
    }
    if (newContentYBottom > (props.relativeToParent ? parent.clientHeight : window.innerHeight)) offsetY -= buttonHeight + contentHeight + 16;

    /* Apply the offset */
    content.style.left = `${offsetX}px`;
    content.style.top = `${offsetY}px`;
  }

  useEffect(() => {
    if (contentRef.current && props.buttonRef.current) {
      const content = contentRef.current as HTMLDivElement;
      const button = props.buttonRef.current as HTMLButtonElement;

      setPosition(content, button);

      const resizeObserver = new ResizeObserver(() => {
        setPosition(content, button);
      });
      resizeObserver.observe(content);
      return () => resizeObserver.disconnect(); // clean up
    }
  });

  return (
    props.content !== "" && !isTouchscreen && (
      <div
        ref={contentRef}
        className={`
          pointer-events-none absolute z-50 whitespace-nowrap rounded-lg px-3
          py-2 text-sm font-medium text-white shadow-md backdrop-blur-sm
          backdrop-grayscale transition-transform no-scrollbar bg-olympus-800/90
        `}
      >
        {props.content}
      </div>
    )
  );
}
