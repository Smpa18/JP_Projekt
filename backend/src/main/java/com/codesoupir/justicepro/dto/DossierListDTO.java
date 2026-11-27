package com.codesoupir.justicepro.dto;

import com.codesoupir.justicepro.enums.Stade;
import com.codesoupir.justicepro.enums.StatutDossier;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDate;

/**
 * Eine Zeile in der Tabelle "Dossiers" / "Tous les dossiers" / "Actions en attente".
 *
 * FELDER:
 *  - id: technische ID des Dossiers (für Navigation zur Detailseite)
 *  - numeroDossier: sichtbare Nummer (z.B. DOS-2026-000001)
 *  - dateCreation: Datum der Erstellung
 *  - procureur: Anzeige-Name des zugewiesenen OMP (für die Tabelle)
 *  - procureurId: ID des zugewiesenen Procureur — wird vom Frontend
 *                 (ActionsEnAttente.jsx) benutzt um zu prüfen ob das
 *                 Dossier dem eingeloggten PROCUREUR persönlich gehört.
 *                 PROCUREUR sieht ALLE Dossiers seiner Instance (Access)
 *                 aber darf nur seine eigenen bearbeiten (Encours).
 *  - chambre: zugewiesene Chambre (Voie Civile)
 *  - jugeInstruction: Name des Juge d'instruction (Voie Civile)
 *  - verdictCondamnation: true/false/null — ob ein Urteil gefällt wurde
 *  - stade: aktueller Workflow-Stade des Dossiers
 *  - statut: ACTIF oder FERME
 *  - dateFermeture: Datum der Schließung — wird benutzt um zu berechnen
 *                   ob das Dossier als "Archivé" gilt (FERME + 5 Jahre)
 *  - archive: true wenn Dossier FERME ist UND dateFermeture mehr als
 *             5 Jahre zurückliegt. Wird im Frontend (TousDossiers.jsx)
 *             als grauer "Archivé" Badge angezeigt.
 */
@Data
@AllArgsConstructor
public class DossierListDTO {

    // Technische ID — für Navigation zu /dossiers/:id
    private Long id;

    // Sichtbare Dossier-Nummer (z.B. DOS-2026-000001)
    private String numeroDossier;

    // Erstellungsdatum des Dossiers
    private LocalDate dateCreation;

    // Anzeige-Name des zugewiesenen OMP (Procureur) für die Tabelle
    private String procureur;

    // ID des zugewiesenen Procureur — für Frontend-Filter in ActionsEnAttente.jsx
    // und DossierDetail.jsx (estMonDossier Prüfung)
    private Long procureurId;

    // Zugewiesene Chambre (nur Voie Civile)
    private String chambre;

    // Name des Juge d'instruction (nur Voie Civile)
    private String jugeInstruction;

    // Ob ein Verurteilungs-Urteil gefällt wurde (null = kein Verdict)
    private Boolean verdictCondamnation;

    // Aktueller Workflow-Stade des Dossiers
    private Stade stade;

    // ACTIF = Dossier läuft noch / FERME = Dossier geschlossen
    private StatutDossier statut;

    // Datum der Schließung — null wenn Dossier noch aktiv.
    // Wird benutzt um archive=true zu berechnen (FERME + 5 Jahre).
    private LocalDate dateFermeture;

    // true wenn Dossier FERME ist UND dateFermeture mehr als 5 Jahre
    // zurückliegt. Wird in TousDossiers.jsx als "Archivé" Badge angezeigt.
    // Berechnung passiert in DossierService.toListDTO().
    private boolean archive;
}