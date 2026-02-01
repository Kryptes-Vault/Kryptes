/** Vite entry — dev server port 5173; OAuth redirects use `window.location.origin`. */
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
