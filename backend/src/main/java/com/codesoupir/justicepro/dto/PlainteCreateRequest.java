package com.codesoupir.justicepro.dto;

import lombok.Data;
import java.util.List;

/**
 * Daten zum Anlegen einer neuen Plainte (Knopf "Enregistrer la plainte").
 *
 * ÄNDERUNGEN:
 *  - suspect (einzeln) → suspects (Liste, mehrere möglich)
 *  - avocatPlaignantId (einzeln) → bleibt für Rückwärtskompatibilität
 *  - avocatSuspectId (einzeln) → bleibt für Rückwärtskompatibilität
 *
 * Die neuen Avocat-Felder per Numéro de l'ordre werden erst in
 * modifierPlainte (WorkflowService) gesetzt, nicht beim ersten Erstellen.
 */
@Data
public class PlainteCreateRequest {

    /**
     * Daten des Plaignants (Beschwerdeführer).
     */
    private PersonneDTO plaignant;

    /**
     * Einzelner Suspect (alter Weg - Rückwärtskompatibilität).
     * Wird in PlainteService als erster Eintrag in die suspects-Liste aufgenommen.
     */
    private PersonneDTO suspect;

    /**
     * Liste von Suspects (neuer Weg - mehrere möglich).
     * Wenn suspects gefüllt ist, wird suspect ignoriert.
     */
    private List<PersonneDTO> suspects;

    /**
     * Avocat du Plaignant per ID (alter Weg - Rückwärtskompatibilität).
     * Wird per Matricule-Suche im Frontend ausgewählt.
     */
    private Long avocatPlaignantId;

    /**
     * Avocat du Suspect per ID (alter Weg - Rückwärtskompatibilität).
     */
    private Long avocatSuspectId;

    /**
     * Hauptbeschreibung der Plainte.
     */
    private String descriptionPlainte;
}