import React, { useEffect, useRef, useState } from "react";

export function OlTooltip(props: { content: string | JSX.Element | JSX.Element[]; buttonRef: React.MutableRefObject<null>; position?: string }) {
  var contentRef = useRef(null);

  function setPosition(content: HTMLDivElement, button: HTMLButtonElement) {
    /* Reset the position of the content */
    content.style.left = "0px";
    content.style.top = "0px";
    content.style.height = "";

    /* Get the position and size of the button and the content elements */
    let [cxl, cyt, cxr, cyb, cw, ch] = [
      content.getBoundingClientRect().x,
      content.getBoundingClientRect().y,
      content.getBoundingClientRect().x + content.offsetWidth,
      content.getBoundingClientRect().y + content.offsetHeight,
      content.offsetWidth,
      content.offsetHeight,
    ];
    let [bxl, byt, bxr, byb, bbw, bh] = [
      button.getBoundingClientRect().x,
      button.getBoundingClientRect().y,
      button.getBoundingClientRect().x + button.offsetWidth,
      button.getBoundingClientRect().y + button.offsetHeight,
      button.offsetWidth,
      button.offsetHeight,
    ];

    /* Limit the maximum height */
    if (ch > 400) {
      ch = 400;
      content.style.height = `${ch}px`;
    }

    /* Compute the horizontal position of the center of the button and the content */
    var cxc = (cxl + cxr) / 2;
    var bxc = (bxl + bxr) / 2;

    /* Compute the x and y offsets needed to align the button and element horizontally, and to put the content depending on the requested position */
    var offsetX = 0;
    var offsetY = 0;

    if (props.position === undefined || props.position === "below") {
      offsetX = bxc - cxc;
      offsetY = byb - cyt + 8;
    } else if (props.position === "side") {
      offsetX = bxr + 8;
      offsetY = byt - cyt + (bh - ch) / 2;
    }

    /* Compute the new position of the left and right margins of the content */
    let ncxl = cxl + offsetX;
    let ncxr = cxr + offsetX;
    let ncyb = cyb + offsetY;

    /* Try and move the content so it is inside the screen */
    if (ncxl < 0) offsetX -= cxl;
    if (ncxr > window.innerWidth) {
      offsetX = bxl - cxl - cw - 12;
    }
    if (ncyb > window.innerHeight) offsetY -= bh + ch + 16;

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
    props.content !== "" && (
      <div
        ref={contentRef}
        className={`
          absolute z-50 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2
          text-sm font-medium text-white shadow-sm
          dark:bg-gray-700
        `}
      >
        {props.content}
      </div>
    )
  );
}
