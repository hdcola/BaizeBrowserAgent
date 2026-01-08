import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";
import "./App.css";
import { i18n } from "@/utils/i18n";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://wxt.dev" target="_blank">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>{i18n("cardTitle")}</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          {i18n("countIs")} {count}
        </button>
        <p>
          {i18n("editPrompt")} <code>src/App.tsx</code> {i18n("andSavePrompt")}
        </p>
      </div>
      <p className="read-the-docs">{i18n("readTheDocs")}</p>
    </>
  );
}

export default App;
