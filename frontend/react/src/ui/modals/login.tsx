import React, { useState, version } from 'react'
import { Modal } from './components/modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCheckCircle, faExternalLink, faLink, faUnlink } from '@fortawesome/free-solid-svg-icons'
import { VERSION, connectedToServer } from '../../olympusapp'

export function LoginModal(props: {
    checkingPassword: boolean,
    loginError: boolean,
    onLogin: (password: string) => void
}) {
    const [password, setPassword] = useState("");

    return <Modal className="h-[70%] w-[70%] overflow-hidden bg-olympus-800 flex">
        <img src="/resources/theme/images/splash/1.jpg" className="w-full opacity-5 contents-center" />
        <div className="absolute flex flex-row max-lg:flex-col p-24 max-lg:p-12 w-full h-full">
            <div className="flex flex-col gap-5 w-[40%] max-lg:w-[100%] h-full content-center justify-start">
                {
                    !props.checkingPassword ?
                        <>
                            <div className="flex flex-col items-start">
                                <div className="pt-1 text-gray-800 dark:text-gray-400 text-xs">Connect to</div>
                                <div className="flex text-gray-800 dark:text-gray-200 text-md font-bold items-center justify-center gap-2"><div data-connected={connectedToServer} className="py-auto text-green-400 data-[connected='true']:dark:bg-green-400 dark:bg-red-500 w-3 h-3 rounded-full"></div> 120.34.546.60:3000 </div>
                            </div>
                            <div className="flex flex-col items-start gap-2">
                                <h1 className="text-4xl text-gray-800 dark:text-white font-bold">DCS Olympus</h1>
                                <div className="flex gap-2 mb-2 select-none rounded-sm content-center text-green-700 dark:text-green-400 text-sm font-semibold"><FontAwesomeIcon icon={faCheckCircle} className="my-auto" />Version {VERSION}</div>
                            </div>
                            {
                                !props.loginError ?
                                    <>
                                        <div className="flex flex-col items-start gap-2">
                                            <label className=" text-gray-800 dark:text-white text-md">Password</label>
                                            <input type="text" onChange={(ev) => setPassword(ev.currentTarget.value)} className="w-80 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter password" required />
                                        </div>
                                        <div className='flex'>
                                            <button type="button" onClick={() => props.onLogin(password)} className="flex content-center items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 rounded-sm">
                                                Login <FontAwesomeIcon className="my-auto" icon={faArrowRight} />
                                            </button>
                                            <button type="button" className="flex content-center items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-blue-800 rounded-sm dark:border-gray-600 border-[1px] dark:text-gray-400">
                                                View Guide <FontAwesomeIcon className="my-auto" icon={faExternalLink} />
                                            </button>
                                        </div>
                                    </>
                                    :
                                    <div>
                                        There was an issue connecting you dog cunt
                                    </div>
                            }

                            <div className="text-gray-500 text-xs">
                                DCS Olympus (the "MATERIAL" or "Software") is provided completely free to users subject to the terms of the CC BY-NC-SA 4.0 Licence except where such terms conflict with this disclaimer, in which case, the terms of this disclaimer shall prevail. Any party making use of the Software in any manner agrees to be bound by the terms set out in the disclaimer. THIS MATERIAL IS NOT MADE OR SUPPORTED BY EAGLE DYNAMICS SA.
                            </div>
                        </>
                        :
                        <div>
                            <svg aria-hidden="true" className="mx-auto w-40 h-full text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                            </svg>
                        </div>
                }
            </div>
            <div className='flex grow'>
                Test
            </div>
        </div>
    </Modal >
}