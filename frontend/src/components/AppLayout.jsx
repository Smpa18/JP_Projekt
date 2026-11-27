import Sidebar from "./Sidebar";
import "./AppLayout.css";

/**
 * Rahmen für ALLE Seiten, die NACH dem Login angezeigt werden.
 * Kombiniert die Sidebar (links) mit dem eigentlichen Seiteninhalt
 * (rechts, über "children" hereingereicht).
 *
 * Beispiel-Benutzung:
 *   <AppLayout>
 *     <h2>Inhalt der Plainte-Seite</h2>
 *   </AppLayout>
 */
export default function AppLayout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">{children}</main>
        </div>
    );
}