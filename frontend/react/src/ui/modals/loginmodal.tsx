import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "./components/modal";
import { Card } from "./components/card";
import { ErrorCallout } from "../components/olcallout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCheckCircle, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { getApp, VERSION } from "../../olympusapp";
import { sha256 } from "js-sha256";
import { LoginSubState, NO_SUBSTATE, OlympusState } from "../../constants/constants";
import { OlDropdown, OlDropdownItem } from "../components/oldropdown";
import { AppStateChangedEvent } from "../../events";

export function LoginModal(props: { open: boolean }) {
  // TODO: add warning if not in secure context and some features are disabled
  const [subState, setSubState] = useState(NO_SUBSTATE);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [commandModes, setCommandModes] = useState(null as null | string[]);
  const [activeCommandMode, setActiveCommandMode] = useState(null as null | string);

  useEffect(() => {
    AppStateChangedEvent.on((state, subState) => {
      setSubState(subState);
    });
  }, []);

  const usernameCallback = useCallback(() => getApp()?.getServerManager().setUsername(username), [username]);
  useEffect(usernameCallback, [username]);

  const passwordCallback = useCallback(() => {
    var hash = sha256.create();
    getApp()?.getServerManager().setPassword(hash.update(password).hex());
  }, [password]);
  useEffect(passwordCallback, [password]);

  const login = useCallback(() => {
    setCheckingPassword(true);

    getApp()
      .getServerManager()
      .getMission(
        (response) => {
          const commandModes = getApp().getMissionManager().getEnabledCommandModes();
          if (commandModes.length > 1) {
            setCommandModes(commandModes);
            setActiveCommandMode(commandModes[0]);
          } else if (commandModes.length == 1) {
            setActiveCommandMode(commandModes[0]);
            getApp().setState(OlympusState.LOGIN, LoginSubState.CONNECT);
          } else {
            setLoginError(true);
          }
          setCheckingPassword(false);
        },
        () => {
          setLoginError(true);
          setCheckingPassword(false);
        }
      );
  }, [commandModes, username, password]);

  const connect = useCallback(() => {
    if (activeCommandMode) {
      getApp().getServerManager().setActiveCommandMode(activeCommandMode);
      getApp().getServerManager().startUpdate();
      getApp().setState(OlympusState.IDLE);

      /* If no profile exists already with that name, create it from scratch from the defaults */
      if (getApp().getProfile() === null) getApp().saveProfile();
      /* Load the profile */
      getApp().loadProfile();
    }
  }, [activeCommandMode]);

  const subStateCallback = useCallback(() => {
    if (subState === LoginSubState.COMMAND_MODE) {
      login();
    } else if (subState === LoginSubState.CONNECT) {
      connect();
    }
  }, [subState, activeCommandMode, commandModes, username, password]);
  useEffect(subStateCallback, [subState]);

  return (
    <Modal
      open={props.open}
      className={`
        inline-flex h-[75%] max-h-[600px] w-[80%] max-w-[1100px] overflow-y-auto
        scroll-smooth bg-white
        dark:bg-olympus-800
        max-md:h-full max-md:max-h-full max-md:w-full max-md:rounded-none
        max-md:border-none
      `}
    >
      <img src="images/splash/1.jpg" className={`
        contents-center w-full object-cover opacity-[7%]
      `}></img>
      <div
        className={`
          absolute h-full w-full bg-gradient-to-r from-blue-200/25
          to-transparent
        `}
      ></div>
      <div
        className={`
          absolute h-full w-full bg-gradient-to-t from-olympus-800
          to-transparent
        `}
      ></div>
      <div
        className={`
          absolute flex w-full flex-col gap-8 p-16
          max-lg:p-8
        `}
      >
        <div
          className={`
            flex w-full flex-row gap-6
            max-lg:flex-col
          `}
        >
          <div
            className={`
              flex w-[40%] flex-grow flex-col content-center justify-start gap-5
              max-lg:w-[100%]
            `}
          >
            {!checkingPassword ? (
              <>
                <div className="flex flex-col items-start">
                  <div
                    className={`
                      pt-1 text-xs text-gray-800
                      dark:text-gray-400
                    `}
                  >
                    Connect to
                  </div>
                  <div
                    className={`
                      flex items-center justify-center gap-2 text-gray-800
                      text-md font-bold
                      dark:text-gray-200
                    `}
                  >
                    {window.location.toString()}
                  </div>
                </div>
                <div
                  className={`
                    flex w-[100%] flex-row content-center items-center gap-2
                  `}
                >
                  <span className="size-[80px] min-w-14">
                    <img src="images/olympus-500x500.png" className={`
                      flex w-full
                    `}></img>
                  </span>
                  <div className={`flex flex-col items-start gap-1`}>
                    <h1
                      className={`
                        flex text-wrap text-4xl font-bold text-gray-800
                        dark:text-white
                      `}
                    >
                      DCS Olympus
                    </h1>
                    <div
                      className={`
                        flex select-none content-center gap-2 rounded-sm text-sm
                        font-semibold text-green-700
                        dark:text-green-400
                      `}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className={`my-auto`} />
                      Version {VERSION}
                    </div>
                  </div>
                </div>
                {!loginError ? (
                  <>
                    {subState === LoginSubState.CREDENTIALS && (
                      <>
                        <div className={`flex flex-col items-start gap-2`}>
                          <label
                            className={`
                              text-gray-800 text-md
                              dark:text-white
                            `}
                          >
                            Username
                          </label>
                          <input
                            type="text"
                            autoComplete="username"
                            onChange={(ev) => setUsername(ev.currentTarget.value)}
                            className={`
                              block w-full max-w-80 rounded-lg border
                              border-gray-300 bg-gray-50 p-2.5 text-sm
                              text-gray-900
                              dark:border-gray-600 dark:bg-gray-700
                              dark:text-white dark:placeholder-gray-400
                              dark:focus:border-blue-500
                              dark:focus:ring-blue-500
                              focus:border-blue-500 focus:ring-blue-500
                            `}
                            placeholder="Enter display name"
                            value={username}
                            required
                          />

                          <label
                            className={`
                              text-gray-800 text-md
                              dark:text-white
                            `}
                          >
                            Password
                          </label>
                          <input
                            type="password"
                            onChange={(ev) => setPassword(ev.currentTarget.value)}
                            className={`
                              block w-full max-w-80 rounded-lg border
                              border-gray-300 bg-gray-50 p-2.5 text-sm
                              text-gray-900
                              dark:border-gray-600 dark:bg-gray-700
                              dark:text-white dark:placeholder-gray-400
                              dark:focus:border-blue-500
                              dark:focus:ring-blue-500
                              focus:border-blue-500 focus:ring-blue-500
                            `}
                            placeholder="Enter password"
                            required
                          />
                        </div>
                        <div className="flex">
                          <button
                            type="button"
                            onClick={() => getApp().setState(OlympusState.LOGIN, LoginSubState.COMMAND_MODE)}
                            className={`
                              mb-2 me-2 flex content-center items-center gap-2
                              rounded-sm bg-blue-700 px-5 py-2.5 text-sm
                              font-medium text-white
                              dark:bg-blue-600 dark:hover:bg-blue-700
                              dark:focus:ring-blue-800
                              focus:outline-none focus:ring-4
                              focus:ring-blue-300
                              hover:bg-blue-800
                            `}
                          >
                            Login
                            <FontAwesomeIcon className={`my-auto`} icon={faArrowRight} />
                          </button>
                          {/*
                            <button type="button" className="flex content-center items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-blue-800 rounded-sm dark:border-gray-600 border-[1px] dark:text-gray-400">
                                View Guide <FontAwesomeIcon className="my-auto text-xs" icon={faExternalLink} />
                             </button>
                          */}
                        </div>
                      </>
                    )}
                    {subState === LoginSubState.COMMAND_MODE && (
                      <>
                        <div className={`flex flex-col items-start gap-2`}>
                          <label
                            className={`
                              text-gray-800 text-md
                              dark:text-white
                            `}
                          >
                            Choose your role
                          </label>
                          <OlDropdown label={activeCommandMode ?? ""} className={`
                            w-48
                          `}>
                            {commandModes?.map((commandMode) => {
                              return <OlDropdownItem onClick={() => setActiveCommandMode(commandMode)}>{commandMode}</OlDropdownItem>;
                            })}
                          </OlDropdown>
                        </div>
                        <div className="flex">
                          <button
                            type="button"
                            onClick={() => getApp().setState(OlympusState.LOGIN, LoginSubState.CONNECT)}
                            className={`
                              mb-2 me-2 flex content-center items-center gap-2
                              rounded-sm bg-blue-700 px-5 py-2.5 text-sm
                              font-medium text-white
                              dark:bg-blue-600 dark:hover:bg-blue-700
                              dark:focus:ring-blue-800
                              focus:outline-none focus:ring-4
                              focus:ring-blue-300
                              hover:bg-blue-800
                            `}
                          >
                            Continue
                            <FontAwesomeIcon className={`my-auto`} icon={faArrowRight} />
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <ErrorCallout
                      title="Server could not be reached or password is incorrect"
                      description="The Olympus Server at this address could not be reached or the password is incorrect. Check your password. If correct, check the address is correct, restart the Olympus server or reinstall Olympus. Ensure the ports set are not already used."
                    ></ErrorCallout>
                    <div className={`text-sm font-medium text-gray-200`}>
                      Still having issues? See our
                      <a
                        href=""
                        className={`
                          text-blue-300 underline
                          hover:no-underline
                        `}
                      >
                        troubleshooting guide here
                      </a>
                      .
                    </div>
                  </>
                )}
              </>
            ) : (
              <div>
                <svg
                  aria-hidden="true"
                  className={`
                    mx-auto my-auto w-40 animate-spin fill-blue-600
                    text-gray-200
                    dark:text-gray-600
                  `}
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              </div>
            )}
          </div>
          <div
            className={`
              flex flex-grow flex-row content-end justify-center gap-3
              overflow-hidden
              max-lg:justify-start
              max-md:flex-col
            `}
          >
            <Card className="flex">
              <img
                src="images/splash/1.jpg"
                className={`
                  h-[40%] max-h-[120px] contents-center w-full rounded-md
                  object-cover
                `}
              ></img>
              <div
                className={`
                  mt-2 flex content-center items-center gap-2 font-bold
                `}
              >
                YouTube Video Guide
                <FontAwesomeIcon className={`my-auto text-xs text-gray-400`} icon={faExternalLink} />
              </div>
              <div
                className={`
                  overflow-hidden text-ellipsis text-xs text-black
                  dark:text-gray-400
                `}
              >
                Check out our official video tutorial on how to get started with Olympus - so you can immediately start controlling the battlefield.
              </div>
            </Card>
            <Card className="flex">
              <img
                src="images/splash/1.jpg"
                className={`
                  h-[40%] max-h-[120px] contents-center w-full rounded-md
                  object-cover
                `}
              ></img>
              <div
                className={`
                  mt-2 flex content-center items-center gap-2 font-bold
                `}
              >
                Wiki Guide
                <FontAwesomeIcon className={`my-auto text-xs text-gray-400`} icon={faExternalLink} />
              </div>
              <div
                className={`
                  overflow-hidden text-ellipsis text-xs text-black
                  dark:text-gray-400
                `}
              >
                Find out more about Olympus through our online wiki guide.
              </div>
            </Card>
          </div>
        </div>
        <div
          className={`
            flex h-full w-full text-xs font-light text-gray-600
            max-lg:flex-col
          `}
        >
          DCS Olympus (the "MATERIAL" or "Software") is provided completely free to users subject to the terms of the CC BY-NC-SA 4.0 Licence except where such
          terms conflict with this disclaimer, in which case, the terms of this disclaimer shall prevail. Any party making use of the Software in any manner
          agrees to be bound by the terms set out in the disclaimer. THIS MATERIAL IS NOT MADE OR SUPPORTED BY EAGLE DYNAMICS SA.
        </div>
      </div>
    </Modal>
  );
}
