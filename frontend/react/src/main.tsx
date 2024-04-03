/***************** UI *******************/
import React from 'react'
import ReactDOM from 'react-dom/client'
import UI from './ui.js'
import './index.css'
import { setupApp } from './olympusapp.js'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <UI />
  </React.StrictMode>,
)

window.onload = setupApp;
