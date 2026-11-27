import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

// Erstellt den "Container", der später überall in der App
// abgefragt werden kann (z.B. "Wer ist gerade eingeloggt?").
const AuthContext = createContext(null);

/**
 * AuthProvider umschließt die GESAMTE App (siehe main.jsx) und
 * stellt den eingeloggten Benutzer + Login/Logout-Funktionen
 * für ALLE Komponenten darunter bereit.
 *
 * user enthält jetzt auch die id des Benutzers, damit das
 * Frontend prüfen kann ob ein Dossier dem eingeloggten
 * Procureur persönlich zugewiesen ist (d.procureurId === user.id).
 */
export function AuthProvider({ children }) {
    // user enthält z.B. { id, nom, prenom, role } nach erfolgreichem Login
    const [user, setUser] = useState(null);

    // loading = true, solange wir noch prüfen, ob jemand
    // bereits eingeloggt ist (z.B. nach einem Seiten-Reload)
    const [loading, setLoading] = useState(true);

    // Wird einmal beim Start der App ausgeführt:
    // Prüft, ob im Browser-Speicher noch Benutzerdaten von einem
    // früheren Login vorhanden sind (damit man nach einem Reload
    // nicht jedes Mal neu einloggen muss).
    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    /**
     * Sendet Numéro Matricule + Mot de passe an das Backend.
     * Bei Erfolg: Token + Benutzerdaten (inkl. id) werden gespeichert.
     *
     * WICHTIG: id wird jetzt aus der Backend-Antwort gespeichert,
     * damit ActionsEnAttente.jsx und DossierDetail.jsx filtern können
     * ob ein Dossier dem eingeloggten Procureur zugewiesen ist.
     */
    async function login(numeroMatricule, motDePasse) {
        const response = await api.post("/auth/login", {
            numeroMatricule,
            motDePasse,
        });

        // id ist jetzt in der Backend-Antwort enthalten
        const { id, token, nom, prenom, role } = response.data;
        const loggedInUser = { id, nom, prenom, role };

        // Im Browser-Speicher merken (überlebt einen Seiten-Reload)
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(loggedInUser));

        setUser(loggedInUser);
        return loggedInUser;
    }

    /** Loggt den Benutzer aus und löscht alle gespeicherten Daten. */
    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Praktischer Helfer: Statt überall "useContext(AuthContext)"
 * zu schreiben, kann man einfach "useAuth()" aufrufen.
 */
export function useAuth() {
    return useContext(AuthContext);
}