import React, { useEffect, useState } from "react";
import { UnitBlueprint } from "../../interfaces";
import { Coalition } from "../../types/types";
import { getWikipediaImage, getWikipediaSummary } from "../../other/utils";
import { OlStateButton } from "./olstatebutton";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import { FaQuestionCircle } from "react-icons/fa";

export function OlUnitSummary(props: { blueprint: UnitBlueprint; coalition: Coalition }) {
  const [imageUrl, setImageUrl] = useState(null as string | null);
  const [summary, setSummary] = useState(null as string | null);
  const [hover, setHover] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null as number | null);

  useEffect(() => {
    getWikipediaImage(props.blueprint.label).then((url) => {
      setImageUrl(url);
    });
  }, [props.blueprint]);

  return (
    <div
      data-coalition={props.coalition}
      className={`
        relative flex flex-col items-start gap-2 border-l-4 bg-white p-2 pb-4
        pt-4 shadow-lg
        dark:bg-olympus-200/30
        data-[coalition='blue']:border-blue-600
        data-[coalition='neutral']:border-gray-400
        data-[coalition='red']:border-red-500
      `}
      onMouseEnter={() => {
        setHoverTimeout(
          window.setTimeout(() => {
            setHover(true);
            setHoverTimeout(null);
          }, 400)
        );
      }}
      onMouseLeave={() => {
        setHover(false);
        if (hoverTimeout) {
          window.clearTimeout(hoverTimeout);
          setHoverTimeout(null);
        }
      }}
    >
      {imageUrl && hover && <img className={``} src={imageUrl} alt="" />}
      <div
        className={`
          flex w-full flex-row content-center justify-between gap-2
          ol-panel-container
        `}
      >
        <div
          className={`
            my-auto ml-2 flex w-full justify-between text-nowrap font-semibold
            tracking-tight text-gray-900
            dark:text-white
          `}
        >
          {props.blueprint.label}
        </div>
        {imageUrl && (
          <div className="flex w-full min-w-0 gap-1 text-sm text-gray-500">
            <FaQuestionCircle
              className={`my-auto min-w-4`}
            />
            <div className={`my-auto max-w-full truncate`}>Hover to show image</div>
          </div>
        )}
      </div>
      <div className={`flex h-fit flex-col justify-between px-2 leading-normal`}>
        <p
          className={`
            mb-1 text-sm text-gray-700
            dark:text-gray-400
          `}
        >
          {summary ?? props.blueprint.description}
        </p>
      </div>
      <div className="flex flex-row gap-1 px-2">
        {props.blueprint.abilities?.split(" ").map((ability) => {
          return <>{ ability.replaceAll(" ", "") !== "" &&
            <div
              key={ability}
              className={`
                rounded-full bg-olympus-800 px-2 py-0.5 text-xs font-bold
                dark:text-olympus-50
              `}
            >
              {ability}
            </div>
           }</>
        })}

        <div
          className={`
            rounded-full bg-olympus-800 px-2 py-0.5 text-xs font-bold
            dark:text-olympus-50
          `}
        >
          {props.blueprint.era === "WW2"
            ? "WW2"
            : props.blueprint.era.split(" ").map((word) => {
                return word.charAt(0).toLocaleUpperCase();
              })}
        </div>
      </div>
    </div>
  );
}
