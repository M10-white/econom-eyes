import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";

const savedTheme = localStorage.getItem("economeyes-theme");
if (savedTheme === "light") {
  document.documentElement.setAttribute("data-theme", "light");
} else if (savedTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
