/***************** UI *******************/
import React from 'react'
import ReactDOM from 'react-dom/client'
import { setupApp } from './olympusapp.js'
import { UI } from './ui.js';

import './index.css'

import 'flowbite';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <UI />
  </React.StrictMode>,
)

window.onload = setupApp;
