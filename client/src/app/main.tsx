import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setupWorker } from "msw/browser";
import App from "./App";
import { handlers } from "@/mocks/handlers";

const worker = setupWorker(...handlers);

if (import.meta.env.DEV) {
    worker.start();
}

const root = document.getElementById('root')
if (root) {
    createRoot(root).render(
        <StrictMode>
            <App />
        </StrictMode>
    )
}