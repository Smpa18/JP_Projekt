import "./PlainteDetails.css";

/**
 * Zeigt ALLE Informationen einer Plainte an (Plaignant, Suspect,
 * Beschreibung) - entspricht dem "Wiederaufrufen" des
 * Erfassungsformulars, wenn der Greffier auf seine registrierte
 * Plainte klickt.
 *
 * Props:
 *  - plainte: das geladene Plainte-Objekt vom Backend
 *             (mit plaignant, suspect, descriptionPlainte)
 */
export default function PlainteDetails({ plainte }) {
    if (!plainte) return null;

    return (
        <div className="plainte-details-card">
            <h3>Détails de la plainte</h3>

            <div className="plainte-details-grid">
                {/* ----- Plaignant ----- */}
                <div className="plainte-details-personne">
                    <h4>Plaignant</h4>
                    <p><strong>Nom :</strong> {plainte.plaignant?.nom} {plainte.plaignant?.postNom} {plainte.plaignant?.prenom}</p>
                    <p><strong>Sexe :</strong> {plainte.plaignant?.sexe}</p>
                    <p><strong>Lieu de naissance :</strong> {plainte.plaignant?.lieuNaissance}</p>
                    <p><strong>Village d'origine :</strong> {plainte.plaignant?.villageOrigine}</p>
                    <p><strong>District :</strong> {plainte.plaignant?.districtOrigine}</p>
                    <p><strong>Territoire :</strong> {plainte.plaignant?.territoire}</p>
                    <p><strong>Assistance :</strong> {plainte.plaignant?.assistance ? "Oui" : "Non"}</p>
                </div>

                {/* ----- Suspect ----- */}
                <div className="plainte-details-personne">
                    <h4>Suspect</h4>
                    <p><strong>Nom :</strong> {plainte.suspect?.nom} {plainte.suspect?.postNom} {plainte.suspect?.prenom}</p>
                    <p><strong>Sexe :</strong> {plainte.suspect?.sexe}</p>
                    <p><strong>Lieu de naissance :</strong> {plainte.suspect?.lieuNaissance}</p>
                    <p><strong>Village d'origine :</strong> {plainte.suspect?.villageOrigine}</p>
                    <p><strong>District :</strong> {plainte.suspect?.districtOrigine}</p>
                    <p><strong>Territoire :</strong> {plainte.suspect?.territoire}</p>
                    <p><strong>Assistance :</strong> {plainte.suspect?.assistance ? "Oui" : "Non"}</p>
                </div>
            </div>

            {/* ----- Beschreibung ----- */}
            <div className="plainte-details-description">
                <h4>Description</h4>
                <p>{plainte.descriptionPlainte || "Aucune description fournie."}</p>
            </div>
        </div>
    );
}