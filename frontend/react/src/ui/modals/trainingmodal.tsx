import React, { useState } from "react";
import { Modal } from "./components/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FaLink } from "react-icons/fa6";
import { FaQuestionCircle } from "react-icons/fa";

const MAX_STEPS = 15;

export function TrainingModal(props: { open: boolean }) {
  const [step, setStep] = useState(0);

  return (
    <Modal open={props.open} size="lg">
      <>
        {step === 0 && (
          <div>
            <h1 className={`text-3xl font-semibold text-gray-200`}>DCS Olympus quick reference guide</h1>
          </div>
        )}
      </>

      <>
        {step === 0 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img
              src="images/olympus-500x500.png"
              className={`
                pointer-events-none absolute left-[50%] top-[50%] my-auto
                aspect-square h-[80%] translate-x-[-50%] translate-y-[-50%]
                rounded-xl opacity-[2%]
              `}
            />
            <div className="flex flex-col gap-4 gap-x-10 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Home</h2>
              <p>
                Welcome to the Olympus quick start guide! This tour will guide you through the basics of DCS Olympus. You can navigate through the steps using
                the "Next" and "Previous" buttons at the bottom of the screen, or select a topic from the list below.
              </p>
              <div className={`
                flex w-fit flex-col flex-wrap gap-2
                md:h-32
              `}>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <div className={`cursor-pointer text-blue-400`} onClick={() => setStep(1)}>
                    Main navbar
                  </div>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <div className={`cursor-pointer text-blue-400`} onClick={() => setStep(2)}>
                    Spawning units
                  </div>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <div className={`cursor-pointer text-blue-400`} onClick={() => setStep(5)}>
                    Controlling units
                  </div>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <div className={`cursor-pointer text-blue-400`} onClick={() => setStep(9)}>
                    The unit marker
                  </div>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <div className={`cursor-pointer text-blue-400`} onClick={() => setStep(11)}>
                    Interacting with the map
                  </div>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <div className={`cursor-pointer text-blue-400`} onClick={() => setStep(13)}>
                    Mission drawings
                  </div>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <div className={`cursor-pointer text-blue-400`} onClick={() => setStep(14)}>
                    The audio backend
                  </div>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <div className={`cursor-pointer text-blue-400`} onClick={() => setStep(15)}>
                    Game master mode
                  </div>
                </div>
                <div className="flex gap-2">
                  <FaLink className="my-auto" />
                  <div className={`cursor-pointer text-blue-400`} onClick={() => {}}>
                    Advanced topics
                  </div>
                </div>
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
        )}
      </>

      <>
        {step === 1 && (
          <div
            className={`
              flex flex-col content-center gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/step1.gif" className={`
              h-96 w-96 rounded-xl
            `} />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Main navbar</h2>
              <p>
                The main functions of DCS Olympus are accessible from the main navbar. You can access the spawn tool, the unit selection and control tool, the
                drawings tool, the audio/radio tool, and the game master options from here.
              </p>
              <p>On the bottom left corner, you can find the DCS Olympus options tool and the button to access this quick reference guide.</p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 2 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/step2.gif" className={`
              h-96 w-96 rounded-xl
            `} />
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
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/step3.gif" className={`
              h-96 w-96 rounded-xl
            `} />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Spawning units (2 of 3)</h2>
              <p>
                You can also spawn units directly on the map by right clicking on it and selecting the unit you want to spawn. This will spawn the unit at the
                clicked location.
              </p>
              <p>You can edit the unit properties like in the previous method. Remember you can open the unit summary section to get more info on the unit.</p>
              <div className="flex gap-4">
                <img src="images/training/step3.1.gif" className={`
                  h-32 w-32 rounded-xl
                `} />
                You can change the spawn heading of the unit by dragging the arrow on the map. This will also change the spawn heading in the unit properties.
              </div>
            </div>
          </div>
        )}
      </>

      <>
        {step === 4 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/step4.gif" className={`
              h-96 w-96 rounded-xl
            `} />
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
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/step5.gif" className={`
              h-96 w-96 rounded-xl
            `} />
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
              <div className="flex gap-4">
                <img src="images/training/step4.1.gif" className={`
                  h-40 w-40 rounded-xl
                `} />
                Holding down the right mouse button enters "group movement" mode. The units will hold their relative positions and move as a formation. Move the
                mouse to choose the formation heading. Ctrl can be pressed to create a path.
              </div>
            </div>
          </div>
        )}
      </>

      <>
        {step === 6 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/step6.gif" className={`
              h-96 w-96 rounded-xl
            `} />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Controlling units (2 of 4)</h2>
              <p>
                To issue an instruction to a unit, long press the left mouse button on the map. This will open a context menu allowing you to select an action,
                depending on what you clicked on. The same can be done by clicking a unit marker, which will show the unit's context menu.{" "}
              </p>
              <p>
                Actions are color coded:
                <ul className="list-inside list-disc">
                  <li className="text-white">White: Movement</li>
                  <li className="text-green-400">Green: Miscellaneous (group, center on map, etc)</li>
                  <li className="text-purple-400">Purple: Admin (AAR, land, etc)</li>
                  <li className="cursor-pointer text-blue-400">Blue: Attack or engage</li>
                  <li className="text-red-400">Red: Delete or destroy</li>
                </ul>
              </p>
              <p></p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 7 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/step7.gif" className={`
              h-96 w-96 rounded-xl
            `} />
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
              <p>You can hold the left mouse button down to enter "group" mode just like for movement. Moving the mouse allows to rotate the tool patterns.</p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 8 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/step8.gif" className={`
              h-96 w-96 rounded-xl
            `} />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Controlling units (4 of 4)</h2>
              <p>
                {" "}
                Unit properties are set using the unit control menu, which opens automatically when a unit is selected. Here, depending on the selected unit,
                you can set altitude and speed, Rules Of Engagement, reaction to threat, as well as advanced settings like AWACS frequencies and so on.{" "}
              </p>
              <p>
                {" "}
                Available options will change depending on selected unit type and number. If different types of units are selected at the same time, only common
                properties will be editable. Use the units list on the upper part of the panel to refine your choice.{" "}
              </p>
              <p>
                {" "}
                If the selected units have properties set differently, the relevant inputs will show a "Different value" state, or show no state at all until
                the same value is set for all units.
              </p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 9 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/unitmarker.png" className={`
              max-h-34 max-w-34 my-auto rounded-xl
            `} />
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
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>The unit marker (2 of 2)</h2>
              <p>The unit marker has a symbol showing the unit state, i.e. what instruction it is performing. These are all the possible values:</p>
              <div
                className={`
                  flex flex-col flex-wrap gap-4
                  sm:max-h-64
                `}
              >
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

      <>
        {step === 11 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Interacting with the map (1 of 2)</h2>
              <p>
                Moving the map is done in a similar way to other map applications. You can use the mouse wheel to zoom in and out, and click and drag to move
                the map. On mobile, you can use two fingers to zoom in and out, and one finger to move the map.
              </p>
              <p>
                You have multiple options for selecting units. Clicking on a unit will select it. If you want to select multiple units, you can hold the ctrl
                key and click on them. A double click on the unit will perform the same operations, but on all currently visible units of the same type. This is
                useful for selecting all units of a certain type, like all F-16s.
              </p>
              <p>
                Box selection mode can be accessed in three different ways: by long pressing on the map with left mouse button (but only if no unit is currently
                selected), by holding the alt key and clicking on the map, or by using the box selection tool. This will select all units inside the box.
              </p>
              <p>
                Ctrl + A will select all the visible units on the map. Toggling the visibility of unwanted units and using this shortcut is a good way to select
                all units of a certain coalition or type. A more advanced selection tool can be accessed by clicking on the unit selection tool on the main
                navbar.
              </p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 12 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/step12.gif" className={`
              h-96 w-96 rounded-xl
            `} />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Interacting with the map (2 of 2)</h2>
              <p>
                Measurements can be perfomed on the map. To enter measure mode you can either use the measure tool, or click the mouse wheel. Subsequent clicks
                on the map will add additional points. You will be able to read the leg length and bearing, as well as the overall length of the line.
              </p>
              <div
                className={`
                  flex w-full flex-col content-center justify-center gap-4
                `}
              >
                <img src="images/training/step12.1.png" className={`
                  mx-auto w-40 rounded-xl
                `} />
                On the bottom right corner of the map, you can find the coordinates panel, providing the coordinates of the mouse cursor, as well as its
                bullseye position and the ground elevation. Click on the coordinates to rotate format.
              </div>
            </div>
          </div>
        )}
      </>

      <>
        {step === 13 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <img src="images/training/step13.png" className={`h-96 rounded-xl`} />
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Mission drawings</h2>
              <p>Mission drawings are useful to provide information from the mission creator. They can define borders, Areas of Operation, navigational points and more. </p>
              <p>Mission drawings are automatically imported from the mission and can be shown using the drawing menu. You can enable or disable different sections, change the opacity, and look for specific drawings or navpoint using the shearch bar.</p>
              <p>You can also define your own drawings, which can be useful as reference, or as a way to automatically create IADS.</p>
              <p>Use the <FaQuestionCircle className="inline"/> button on the upper right of the drawings panel for more info. </p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 14 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>The audio backend</h2>
              <p></p>
              <p></p>
            </div>
          </div>
        )}
      </>

      <>
        {step === 15 && (
          <div
            className={`
              flex flex-col gap-4
              md:flex-row
              sm:gap-16
            `}
          >
            <div className="flex flex-col gap-4 text-gray-400">
              <h2 className={`text-xl font-semibold text-white`}>Game master mode</h2>
              <p></p>
              <p></p>
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
          <div
            className={`
              my-auto hidden gap-2
              sm:flex
            `}
          >
            {[...Array(MAX_STEPS).keys()].map((i) => (
              <div
                key={i + 1}
                className={`
                  h-4 w-4 rounded-full
                  ${
                    i + 1 === step
                      ? "bg-blue-700 shadow-white"
                      : `bg-gray-300/10`
                  }
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
