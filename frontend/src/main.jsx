// WICHTIG: Diese Zeile muss ZUERST kommen!
// Lädt die globalen Design-Grundlagen (Farben, Schriftarten),
// die in JEDER anderen CSS-Datei der App benutzt werden
// (z.B. var(--color-primary) in Sidebar.css).
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

// Startpunkt der gesamten React-App.
// "root" ist das <div> in index.html, in das React die App einhängt.
createRoot(document.getElementById("root")).render(
    <StrictMode>
        {/* BrowserRouter ermöglicht Navigation zwischen Seiten (URLs) */}
        <BrowserRouter>
            {/* AuthProvider macht "wer ist eingeloggt" überall verfügbar */}
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);