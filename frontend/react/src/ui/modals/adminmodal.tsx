import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "./components/modal";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../olympusapp";
import { OlympusState, WarningSubstate } from "../../constants/constants";
import { FaPlus, FaTrash } from "react-icons/fa";
import { sha256 } from "js-sha256";
import { AdminPasswordChangedEvent } from "../../events";
import { OlDropdown } from "../components/oldropdown";
import { OlCheckbox } from "../components/olcheckbox";

export function AdminModal(props: { open: boolean }) {
  const [configs, setConfigs] = useState({} as { groups: { [key: string]: string[] }; users: { [key: string]: { password: string; roles: string[] } } });
  const [newUserName, setNewUserName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    AdminPasswordChangedEvent.on((password) => {
      setAdminPassword(password);

      var hash = sha256.create();

      const requestOptions: RequestInit = {
        method: "GET", // Specify the request method
        headers: {
          Authorization: "Basic " + btoa(`Admin:${hash.update(password).hex()}`),
        }, // Specify the content type
      };

      fetch(`./admin/config`, requestOptions)
        .then((response) => {
          if (response.status === 200) {
            console.log(`Admin password correct`);
            return response.json();
          } else {
            throw new Error("Admin password incorrect");
          }
        })
        .then((data) => {
          setConfigs(data);
        })
        .catch((error) => {
          console.error(`Error reading configuration: ${error}`);
        });
    });
  }, []);

  const uploadNewConfig = useCallback(() => {
    var hash = sha256.create();

    const requestOptions: RequestInit = {
      method: "PUT", // Specify the request method
      headers: {
        Authorization: "Basic " + btoa(`Admin:${hash.update(adminPassword).hex()}`),
        "Content-Type": "application/json",
      }, // Specify the content type
      body: JSON.stringify(configs),
    };

    fetch(`./admin/config`, requestOptions)
      .then((response) => {
        if (response.status === 200) {
          console.log(`Configuration uploaded`);
        } else {
          throw new Error("Error uploading configuration");
        }
      })
      .catch((error) => {
        getApp().setState(OlympusState.WARNING, WarningSubstate.ERROR_UPLOADING_CONFIG);
        console.error(`Error uploading configuration: ${error}`);
      });
  }, [adminPassword, configs]);

  return (
    <Modal open={props.open} size={"full"}>
      <h2 className="text-2xl font-bold text-gray-200">User admin panel</h2>
      <div
        className={`
          flex w-full flex-col gap-4 p-4
          lg:flex-row
        `}
      >
        
        <div
          className={`
            flex flex-col gap-2 rounded-lg border-2 border-gray-500
            bg-olympus-600/50 p-4
            lg:w-[40%]
          `}
        >
          <div className="text-white">Groups:</div>
          <div
            className={`
              flex h-[calc(100vh-450px)] flex-col gap-1 overflow-auto p-2
            `}
          >
            {configs.groups &&
              Object.keys(configs.groups).map((group: any, idx: number) => {
                return (
                  <div
                    key={group}
                    className={`
                      flex justify-between gap-4 bg-white/5 p-2 text-sm
                      text-gray-200
                      ${idx % 2 === 0 ? "bg-black/5" : ""}
                    `}
                  >
                    <div className="my-auto">{group}</div>
                    <OlDropdown
                      label="Enabled roles"
                      className={`my-auto ml-auto min-w-48`}
                      disableAutoClose={true}
                    >
                      {["Game master", "Blue commander", "Red commander"].map((role: any) => {
                        return (
                          <div key={role} className="flex gap-2 p-2">
                            <OlCheckbox
                              checked={configs["groups"][group].includes(role)}
                              onChange={(ev) => {
                                if (ev.target.checked) {
                                  configs["groups"][group].push(role);
                                } else {
                                  configs["groups"][group] = configs["groups"][group].filter((r: any) => r !== role);
                                }
                                setConfigs({ ...configs });
                              }}
                            ></OlCheckbox>
                            {role}
                          </div>
                        );
                      })}
                    </OlDropdown>
                    <div
                      className={`
                        my-auto cursor-pointer rounded-md bg-red-600 p-2
                        hover:bg-red-400
                      `}
                      onClick={() => {
                        delete configs["groups"][group];
                      }}
                    >
                      <FaTrash className={`text-gray-50`}></FaTrash>
                    </div>
                  </div>
                );
              })}
            {(configs.groups === undefined || Object.keys(configs.groups).length === 0) && (
              <div
                className={`text-gray-400`}
              >
                No groups defined
              </div>
            )}
          </div>
          <div className="flex justify-between gap-4">
            <input
              type="text"
              autoComplete="new-password"
              onChange={(ev) => {
                setNewGroupName(ev.currentTarget.value);
              }}
              className={`
                rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm
                text-gray-900
                dark:border-gray-600 dark:bg-gray-700 dark:text-white
                dark:placeholder-gray-400 dark:focus:border-blue-500
                dark:focus:ring-blue-500
                focus:border-blue-500 focus:ring-blue-500
              `}
              placeholder="New group name"
              value={newGroupName}
              required
            />
            <div
              className={`
                my-auto cursor-pointer rounded-md border-[1px] border-white
                bg-transparent p-2
                hover:bg-gray-800
              `}
              onClick={() => {
                if (newGroupName === "") return;
                configs["groups"][newGroupName] = [];
                setConfigs({ ...configs });
                setNewGroupName("");
              }}
            >
              <FaPlus className={`text-gray-50`} />
            </div>
          </div>
        </div>
        <div
          className={`
            flex flex-col gap-2 rounded-lg border-2 border-gray-500
            bg-olympus-600/50 p-4
            lg:w-[58%]
          `}
        >
          <div className="text-white">Users:</div>
          <div
            className={`
              flex h-[calc(100vh-450px)] flex-col gap-1 overflow-auto p-2
            `}
          >
            {configs.users &&
              Object.keys(configs.users).map((user: any, idx: number) => {
                return (
                  <div
                    key={user.id}
                    className={`
                      flex flex-col gap-2 bg-white/5 p-2 text-sm text-gray-200
                      lg:flex-row
                      ${idx % 2 === 0 ? "bg-black/5" : ""}
                    `}
                  >
                    <div
                      className={`
                        flex w-full content-center justify-between gap-4
                      `}
                    >
                      <div className="my-auto">{user}</div>

                      <OlDropdown
                        label="Enabled roles"
                        className={`my-auto ml-auto min-w-48`}
                        disableAutoClose={true}
                      >
                        {["Game master", "Blue commander", "Red commander"].map((role: any) => {
                          return (
                            <div key={role} className="flex gap-2 p-2">
                              <OlCheckbox
                                checked={configs["users"][user].roles.includes(role)}
                                onChange={(ev) => {
                                  if (ev.target.checked) {
                                    configs["users"][user].roles.push(role);
                                  } else {
                                    configs["users"][user].roles = configs["users"][user].roles.filter((r: any) => r !== role);
                                  }
                                  setConfigs({ ...configs });
                                }}
                              ></OlCheckbox>
                              {role}
                            </div>
                          );
                        })}
                      </OlDropdown>
                    </div>

                    <div className="flex content-center justify-between gap-4">
                      <input
                        type="password"
                        autoComplete="new-password"
                        onChange={(ev) => {
                          var hash = sha256.create();
                          configs["users"][user].password = hash.update(ev.currentTarget.value).hex();
                          setConfigs({ ...configs });
                        }}
                        className={`
                          w-full rounded-lg border border-gray-300 bg-gray-50
                          p-2.5 text-sm text-gray-900
                          dark:border-gray-600 dark:bg-gray-700 dark:text-white
                          dark:placeholder-gray-400 dark:focus:border-blue-500
                          dark:focus:ring-blue-500
                          focus:border-blue-500 focus:ring-blue-500
                          lg:max-w-92
                        `}
                        placeholder="Change password"
                        required
                      />
                      <div
                        className={`
                          my-auto cursor-pointer rounded-md bg-red-600 p-2
                          hover:bg-red-400
                        `}
                        onClick={() => {
                          delete configs["users"][user];
                          setConfigs({ ...configs });
                        }}
                      >
                        <FaTrash className={`text-gray-50`}></FaTrash>
                      </div>
                    </div>
                  </div>
                );
              })}
            {(configs.users === undefined || Object.keys(configs.users).length === 0) && (
              <div
                className={`text-gray-400`}
              >
                No users defined
              </div>
            )}
          </div>
          <div className="flex justify-between gap-4">
            <input
              type="text"
              autoComplete="new-password"
              onChange={(ev) => {
                setNewUserName(ev.currentTarget.value);
              }}
              className={`
                rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm
                text-gray-900
                dark:border-gray-600 dark:bg-gray-700 dark:text-white
                dark:placeholder-gray-400 dark:focus:border-blue-500
                dark:focus:ring-blue-500
                focus:border-blue-500 focus:ring-blue-500
              `}
              placeholder="New user name"
              value={newUserName}
              required
            />
            <div
              className={`
                my-auto cursor-pointer rounded-md border-[1px] border-white
                bg-transparent p-2
                hover:bg-gray-800
              `}
              onClick={() => {
                if (newUserName === "") return;
                configs["users"][newUserName] = { password: "", roles: [] };
                setConfigs({ ...configs });
                setNewUserName("");
              }}
            >
              <FaPlus className={`text-gray-50`} />
            </div>
          </div>
        </div>
      </div>
      <div
        className={`
          mt-auto flex flex-col justify-between gap-4
          lg:flex-row
        `}
      >
        <div className="my-auto flex gap-4 text-sm text-gray-400">
          <div className="my-auto">Reset all user preferences, use with caution</div>
          <div>
            <button
              type="button"
              onClick={() => getApp().resetAllProfiles()}
              className={`
                flex content-center items-center gap-2 text-nowrap rounded-sm
                border-[1px] bg-blue-700 px-5 py-2.5 text-sm font-medium
                text-white
                dark:border-red-600 dark:bg-red-800 dark:text-gray-400
                dark:hover:bg-red-700 dark:focus:ring-blue-800
                focus:outline-none focus:ring-4 focus:ring-blue-300
                hover:bg-red-800
              `}
            >
              Reset profiles
              <FaTrash />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            uploadNewConfig();
            getApp().setState(OlympusState.IDLE);
          }}
          className={`
            my-auto ml-auto flex content-center items-center gap-2 rounded-sm
            bg-blue-700 px-5 py-2.5 text-sm font-medium text-white
            dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
            focus:outline-none focus:ring-4 focus:ring-blue-300
            hover:bg-blue-800
          `}
        >
          Apply changes
          <FontAwesomeIcon className={`my-auto`} icon={faArrowRight} />
        </button>
      </div>
    </Modal>
  );
}
