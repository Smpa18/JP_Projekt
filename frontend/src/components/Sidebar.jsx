import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

/**
 * Sidebar mit Navigation für alle Seiten.
 * Zeigt alle Menu-Punkte für alle Rollen —
 * die Zugriffsrechte pro Seite werden auf den
 * jeweiligen Seiten selbst gesteuert.
 *
 * MENU-PUNKTE:
 *  - Accueil: Startseite
 *  - Plainte: neue Plainte erstellen (Greffier)
 *  - Dossiers: eigene Dossiers (rollenspezifisch gefiltert)
 *  - Dossiers en cours: Dossiers die eine Aktion brauchen
 *  - Tous les dossiers: alle Dossiers aller Instances (read-only)
 *                       Archivierte Dossiers (FERME + 5 Jahre) sind
 *                       hier ebenfalls suchbar mit Datumsfilter.
 *  - Administrator: Benutzerverwaltung, Instances, Barreaux
 */
export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/");
    }

    const menuItems = [
        { to: "/", label: "Accueil", icon: "🏠" },
        { to: "/plainte", label: "Plainte", icon: "📝" },
        { to: "/dossiers", label: "Dossiers", icon: "📁" },
        { to: "/actions-en-attente", label: "Dossiers en cours", icon: "⏳" },
        { to: "/tous-dossiers", label: "Tous les dossiers", icon: "🗂️" },
        //{ to: "/historique", label: "Historique", icon: "📋" },
        { to: "/administrator", label: "Administrator", icon: "⚙️" },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-title">Justice Pro</h1>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/"}
                        className="sidebar-link"
                    >
                        <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {user?.prenom?.[0]}{user?.nom?.[0]}
                    </div>
                    <div className="sidebar-user-text">
                        <strong>{user?.prenom} {user?.nom}</strong>
                        <span>{user?.role}</span>
                    </div>
                </div>

                <button className="sidebar-logout" onClick={handleLogout}>
                    Se déconnecter
                </button>
            </div>
        </aside>
    );
}