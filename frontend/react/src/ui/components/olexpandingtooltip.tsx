import React from "react";
import { FaQuestionCircle } from "react-icons/fa";

export function OlExpandingTooltip(props: { title: string; content: string | JSX.Element | JSX.Element[] }) {
  return (
    <div className="overflow-hidden" style={{ animationName: "tooltipFadeInHeight", animationDuration: "1s", animationFillMode: "forwards", height: "26px" }}>
         <div className={`absolute left-0 top-0 h-full w-full bg-transparent`}>
          <div
            className="h-full bg-blue-500/5"
            style={{ animationName: "loadingBar", animationDuration: "1s", animationFillMode: "forwards", width: "100%" }}
          ></div>
        </div>
      <div className="mb-4 flex h-6 content-center gap-2 px-2">
       
        <div className="my-auto">
          <FaQuestionCircle className={`text-gray-200`} />
        </div>
        <div className="my-auto">{props.title}</div>
      </div>
      <div
        className={`
          flex min-w-[350px] flex-col gap-2 text-wrap p-2 text-gray-400
        `}
        style={{ animationName: "tooltipFadeInWidth", animationDuration: "1s", animationFillMode: "forwards", width: "1px" }}
      >
        {props.content}
      </div>
    </div>
  );
}
