/***************** UI *******************/
import React from "react";
import ReactDOM from "react-dom/client";
import { UI } from "./ui/ui.js";

import "./index.css";

window.addEventListener("contextmenu", e => e. preventDefault());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <UI />
  </React.StrictMode>
);
