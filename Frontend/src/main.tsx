import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import AppShell from "./components/app-shell";
import SignIn from "./components/views/signin";
import "./main.css";

function App() {
  useEffect(() => {
    void import("../app");
  }, []);

  return (
    <>
      <SignIn />
      <AppShell />
    </>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("The app root element is missing.");

const rootContainer = rootElement as HTMLElement & { reactRoot?: Root };
const appRoot = rootContainer.reactRoot ?? createRoot(rootElement);
rootContainer.reactRoot = appRoot;
appRoot.render(<App />);
