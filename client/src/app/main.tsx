import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setupWorker } from "msw/browser";
import App from "./App";
import { handlers } from "@/mocks/handlers";

const worker = setupWorker(...handlers);

const prepareMsw = async () => {
    if (import.meta.env.DEV) {
        await worker.start();
    }
}

prepareMsw().then(() => {
    const root = document.getElementById('root')
    if (root) {
        createRoot(root).render(
            <StrictMode>
                <App />
            </StrictMode>
        )
    }
})