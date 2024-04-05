/***************** UI *******************/
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { setupApp } from './olympusapp.js'
import 'flowbite';
import { UI } from './ui.js';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <UI />
  </React.StrictMode>,
)

window.onload = setupApp;
