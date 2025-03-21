import React, { useState } from "react";
import { Modal } from "./components/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FaCaretRight, FaLink } from "react-icons/fa6";
import { FaQuestionCircle } from "react-icons/fa";

const MAX_STEPS = 10;

export function TrainingModal(props: { open: boolean }) {
  const [step, setStep] = useState(0);

  return (
    <Modal open={props.open}>
      <div>
        <h1 className={`text-2xl font-semibold text-white`}>DCS Olympus guided tour</h1>
        
      </div>

      <>
        {step === 0 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <img
              src="images/olympus-500x500.png"
              className={`my-auto h-40 w-40 rounded-xl`}
            />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Home</h2>
              <p>
                Welcome to the Olympus quick start guide! This tour will guide you through the basics of DCS Olympus. You can navigate through the steps using
                the "Next" and "Previous" buttons at the bottom of the screen, or select a topic from the list below.
              </p>
              <div className="flex flex-col flex-wrap gap-2">
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <a href="#" className={`text-blue-400`} onClick={() => setStep(1)}>
                    Main navbar
                  </a>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <a href="#" className={`text-blue-400`} onClick={() => setStep(2)}>
                    Spawning units
                  </a>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <a href="#" className={`text-blue-400`} onClick={() => setStep(5)}>
                    Controlling units
                  </a>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <a href="#" className={`text-blue-400`} onClick={() => setStep(9)}>
                    The unit marker
                  </a>
                </div>
                <div>
                  Every panel has a dedicated integrated wiki. Click on the{" "}
                  <span
                    className={`
                      mt-[-7px] inline-block translate-y-2 rounded-full p-1
                    `}
                  >
                    <FaQuestionCircle />
                  </span>{" "}
                  symbol to access it. Moreover, most clickable content has tooltips providing info about their function.
                </div>
              </div>
            </div>
          </div>
        )}
      </>

      <>
        {step === 1 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <img
              src="images/training/step1.gif"
              className={`h-72 w-72 rounded-xl`}
            />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Main navbar</h2>
              <p>
                The main functions of DCS Olympus are accessible from the main navbar. You can access the spawn tool, the unit selection and control tool, the
                drawings tool, the audio/radio tool, and the game master options from here.
              </p>
              <p>On the bottom left corner, you can find the DCS Olympus options tool.</p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 2 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <img
              src="images/training/step2.gif"
              className={`h-72 w-72 rounded-xl`}
            />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Spawning units (1 of 3)</h2>
              <p>
                To spawn a unit, click on the spawn tool icon on the main navbar. This will open the spawn tool. You can select the unit you want to spawn by
                searching for it or by finding it in the list, which can be filtered by category.
              </p>
              <p>After selecting the unit you can edit its properties, like spawn altitude and heading, loadout, livery, skill level, and so on.</p>
              <p>
                Once you are happy with your setup, click on the map to spawn the unit. You can click multiple times to spawn more units. When you are done,
                double click to exit the spawning mode.
              </p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 3 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <img
              src="images/training/step3.gif"
              className={`h-72 w-72 rounded-xl`}
            />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Spawning units (2 of 3)</h2>
              <p>
                You can also spawn units directly on the map by right clicking on it and selecting the unit you want to spawn. This will spawn the unit at the
                clicked location.
              </p>
              <p>You can edit the unit properties like in the previous method.</p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 4 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <img
              src="images/training/step4.gif"
              className={`h-72 w-72 rounded-xl`}
            />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Spawning units (3 of 3)</h2>
              <p>
                If you plan on spawning many similar units throughout the mission, you can "star" a unit. This will save the unit in the starred units list,
                which can be accessed from the spawn tool. This way you can quickly spawn the same unit multiple times without having to search for it.
              </p>
              <p>You can edit the unit properties like in the previous method.</p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 5 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <img
              src="images/training/step5.gif"
              className={`h-72 w-72 rounded-xl`}
            />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Controlling units (1 of 4)</h2>
              <p>
                {" "}
                The most basic form of unit control is movement. A short right click on the map will add a destination point. If the ctrl key is held while
                right clicking, the destination will be appended, creating a path.
              </p>
              <p>
                Previously created destinations can be moved by dragging the marker on the map. If multiple units are selected when creating the path,
                destinations will be shared between them.
              </p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 6 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <img
              src="images/training/step6.gif"
              className={`h-72 w-72 rounded-xl`}
            />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Controlling units (2 of 4)</h2>
              <p>
                To issue an instruction to a unit, long press the right mouse button on the map. This will allow you to select an action, depending on what you
                clicked on.
              </p>
              <p></p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 7 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <img
              src="images/training/step7.gif"
              className={`h-72 w-72 rounded-xl`}
            />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Controlling units (3 of 4)</h2>
              <p>
                The same instructions can be issued using the unit control toolbar. First select the tool, then left click on the map to issue the instruction.
                The tool will be active until deselected, either by double clicking on the map, or by clicking on the tool button again.{" "}
              </p>
              <p>
                Tools can be enabled using keyboard shortcuts. To learn what a tool does and what shortcut enables it, place your cursor over the corresponding
                button.{" "}
              </p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 8 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <img
              src="images/training/step8.gif"
              className={`h-72 w-72 rounded-xl`}
            />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Controlling units (4 of 4)</h2>
              <p>
                {" "}
                Unit properties are set using the unit control menu, which opens automatically when a unit is selected. Here, depending on the selected unit,
                you can set altitude and speed, Rules Of Engagement, reaction to threat, as well as advanced settings like AWACS frequencies and so on.{" "}
              </p>
              <p> </p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 9 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <img
              src="images/training/unitmarker.png"
              className={`max-h-34 max-w-34 my-auto rounded-xl`}
            />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>The unit marker (1 of 2)</h2>
              <p>
                The unit marker is a small icon that appears on the map. It shows the unit's type, coalition, and the name (for Mission Editor units and human
                players only). It has the following parts:
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col">
                  <p className="flex gap-4">
                    <div
                      className={`
                        rounded-full bg-gray-400 px-3 py-1 font-bold
                        text-olympus-900
                      `}
                    >
                      1
                    </div>
                    <p className="my-auto">Unit short label or type symbol</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-4">
                    <div
                      className={`
                        rounded-full bg-gray-400 px-3 py-1 font-bold
                        text-olympus-900
                      `}
                    >
                      2
                    </div>
                    <p className="my-auto">Flight level</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-4">
                    <div
                      className={`
                        rounded-full bg-gray-400 px-3 py-1 font-bold
                        text-olympus-900
                      `}
                    >
                      3
                    </div>
                    <p className="my-auto">Ground speed (knots)</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-4">
                    <div
                      className={`
                        rounded-full bg-gray-400 px-3 py-1 font-bold
                        text-olympus-900
                      `}
                    >
                      4
                    </div>
                    <p className="my-auto">Bullseye position</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-4">
                    <div
                      className={`
                        rounded-full bg-gray-400 px-3 py-1 font-bold
                        text-olympus-900
                      `}
                    >
                      5
                    </div>
                    <p className="my-auto">Fuel state (% of internal)</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-4">
                    <div
                      className={`
                        rounded-full bg-gray-400 px-3 py-1 font-bold
                        text-olympus-900
                      `}
                    >
                      6
                    </div>
                    <p className="my-auto">A/A weapons (Fox 1/2/3 & guns)</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-4">
                    <div
                      className={`
                        rounded-full bg-gray-400 px-3 py-1 font-bold
                        text-olympus-900
                      `}
                    >
                      7
                    </div>
                    <p className="my-auto">Current state</p>
                  </p>
                </div>
              </div>
              <p>
                Most of these information is only available for air units. Ground units will show the type symbol, the name, and the coalition, and the fuel
                level is replace by the unit's health (%).
              </p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 10 && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-16">
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>The unit marker (2 of 2)</h2>
              <p>The unit marker has a symbol showing the unit state, i.e. what instruction it is performing. These are all the possible values:</p>
              <div className="flex sm:max-h-64 flex-col flex-wrap gap-4">
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/attack.svg" />
                    <p className={`my-auto`}>Attacking unit or ground</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/awacs.svg" />
                    <p className={`my-auto`}>Operating as AWACS</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/dcs.svg" />
                    <p className={`my-auto`}>Under DCS control</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/follow.svg" />
                    <p className={`my-auto`}>Following unit</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/human.svg" />
                    <p className={`my-auto`}>Human player</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/idle.svg" />
                    <p className={`my-auto`}>Idle, orbiting</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/land-at-point.svg" />
                    <p className={`my-auto`}>Landing at point (helicopter)</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/miss-on-purpose.svg" />
                    <p className={`my-auto`}>Miss on purpose mode</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/no-task.svg" />
                    <p className={`my-auto`}>No task, not controllable</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/off.svg" />
                    <p className={`my-auto`}>Shut down</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/refuel.svg" />
                    <p className={`my-auto`}>Refueling from tanker</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/rtb.svg" />
                    <p className={`my-auto`}>RTB</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/scenic-aaa.svg" />
                    <p className={`my-auto`}>Scenic AAA mode</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/simulate-fire-fight.svg" />
                    <p className={`my-auto`}>Simulating fire fight</p>
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="flex gap-2">
                    <img src="images/states/tanker.svg" />
                    <p className={`my-auto`}>Operating as AAR tanker </p>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </>

      <div className="mt-auto flex justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className={`
              mb-2 me-2 flex content-center items-center gap-2 rounded-sm
              bg-blue-700 px-5 py-2.5 text-sm font-medium text-white
              dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
          >
            <FontAwesomeIcon className={`my-auto`} icon={faArrowLeft} />
            Previous
          </button>
        ) : (
          <div />
        )}

        {step > 0 && (
          <div className="my-auto gap-2 hidden sm:flex">
            {[...Array(MAX_STEPS).keys()].map((i) => (
              <div
                key={i + 1}
                className={`
                  h-4 w-4 rounded-full
                  ${i + 1 === step ? "bg-blue-700 shadow-white" : `
                    bg-gray-300/10
                  `}
                `}
              />
            ))}
          </div>
        )}

        {step < MAX_STEPS ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className={`
              mb-2 me-2 flex content-center items-center gap-2 rounded-sm
              bg-blue-700 px-5 py-2.5 text-sm font-medium text-white
              dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
          >
            Next
            <FontAwesomeIcon className={`my-auto`} icon={faArrowRight} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {}}
            className={`
              mb-2 me-2 flex content-center items-center gap-2 rounded-sm
              bg-blue-700 px-5 py-2.5 text-sm font-medium text-white
              dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
          >
            Finish
          </button>
        )}
      </div>
    </Modal>
  );
}
