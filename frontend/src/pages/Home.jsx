import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import "./Home.css";

/**
 * EINZIGE Hauptseite für Login + Begrüßung.
 *
 * Zustand "nicht eingeloggt"  -> zentriertes Login-Formular
 * Zustand "eingeloggt"        -> AppLayout (Sidebar + Inhalt)
 */
export default function Home() {
    const { user, login } = useAuth();

    // ----- Lokaler State für das Login-Formular -----
    const [numeroMatricule, setNumeroMatricule] = useState("");
    const [motDePasse, setMotDePasse] = useState("");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setErreur("");
        setChargement(true);

        try {
            await login(numeroMatricule, motDePasse);
            // Kein navigate() nötig - sobald "user" gesetzt ist,
            // zeigt diese Komponente automatisch den eingeloggten Bereich.
        } catch (err) {
            const message =
                err.response?.data?.erreur ||
                "Numéro de matricule ou mot de passe incorrect.";
            setErreur(message);
        } finally {
            setChargement(false);
        }
    }

    // ============================================================
    // ZUSTAND 1: NICHT EINGELOGGT -> Login-Bildschirm zeigen
    // ============================================================
    if (!user) {
        return (
            <div className="login-page">
                <div className="login-card">
                    <h1 className="login-title">Justice Pro</h1>
                    <p className="login-subtitle">
                        Système de gestion des dossiers judiciaires
                    </p>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <label htmlFor="numeroMatricule">Numéro Matricule</label>
                        <input
                            id="numeroMatricule"
                            type="text"
                            placeholder="Ex: GREF001"
                            value={numeroMatricule}
                            onChange={(e) => setNumeroMatricule(e.target.value)}
                            required
                            autoFocus
                        />

                        <label htmlFor="motDePasse">Mot de passe</label>
                        <input
                            id="motDePasse"
                            type="password"
                            placeholder="••••••••"
                            value={motDePasse}
                            onChange={(e) => setMotDePasse(e.target.value)}
                            required
                        />

                        {erreur && <p className="login-erreur">{erreur}</p>}

                        <button type="submit" className="login-button" disabled={chargement}>
                            {chargement ? "Connexion en cours..." : "Se connecter"}
                        </button>

                        <a href="#" className="login-forgot">
                            Avez-vous oublié votre mot de passe ?
                        </a>
                    </form>
                </div>
            </div>
        );
    }

    // ============================================================
    // ZUSTAND 2: EINGELOGGT -> Sidebar + Begrüßungsinhalt zeigen
    // ============================================================
    return (
        <AppLayout>
            <div className="home-welcome">
                <h2>Bienvenue, {user.prenom} {user.nom}</h2>
                <p className="home-role">Connecté en tant que {user.role}</p>

                <div className="home-info-card">
                    <p>
                        Utilisez le menu à gauche pour enregistrer une plainte,
                        consulter les dossiers, ou gérer les actions en attente.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}