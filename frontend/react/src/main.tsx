/***************** UI *******************/
import React from 'react'
import ReactDOM from 'react-dom/client'
import { setupApp } from './olympusapp.js'
import { UI } from './ui/ui.js';

import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <UI />
  </React.StrictMode>,
)

//window.onload = setupApp;
