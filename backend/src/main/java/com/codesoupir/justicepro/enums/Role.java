package com.codesoupir.justicepro.enums;

/**
 * Alle Rollen der Mitarbeiter im Justizsystem.
 * Bestimmt, welche Aktionen jemand ausführen darf.
 */
public enum Role {
    GREFFIER,            // registriert Plaintes, verwaltet Pièces
    PROCUREUR_GENERAL,   // PG - weist Procureurs zu, validiert MAP
    PROCUREUR,           // führt die Untersuchung (Voie Pénale)
    PRESIDENT_TRIBUNAL,  // weist Chambres zu (Voie Civile)
    JUGE_INSTRUCTION,    // fällt das Urteil (Verdict)
    AVOCAT,              // vertritt Plaignant oder Suspect
    ADMIN                // verwaltet Benutzer & Instanzen
}