package com.codesoupir.justicepro.enums;

/**
 * Bearbeitungsstatus eines Dossiers im Workflow.
 * Bestimmt, welche Rolle als nächstes handeln muss.
 *
 * VOIE PÉNALE (P):
 *  ENREGISTRE -> ASSIGNATION_PG -> EN_INSTRUCTION_P
 *   -> DECISION_EN_ATTENTE (P hat Décision gesetzt und schickt sie an PG)
 *   -> EN_INSTRUCTION_P (wenn PG annuliert, P muss Décision ändern)
 *   -> EN_INSTRUCTION_P (wenn PG bestätigt, P kann weiterarbeiten)
 *   -> DEMANDE_MAP (P fragt PG um Erlaubnis MAP auszustellen)
 *   -> NOTIFICATION_MAP_P (wenn PG bestätigt, MAP wird automatisch ausgestellt)
 *   -> EN_INSTRUCTION_P (wenn PG annuliert, zurück zu P)
 *   -> VALIDATION_NOTIFICATION_MAP_P -> MAP_VALIDE_P
 *   -> MAPE -> FERME
 *
 * VOIE CIVILE (T):
 *  FIXE -> ASSIGNATION_PT -> ASSIGNE_GREFF_T -> EN_INSTRUCTION_CH
 *   -> NOTIFICATION_MAP_T -> MAP_VALIDE_CH -> FERME
 */
public enum Stade {

    // Start (für beide Wege)
    ENREGISTRE,

    // Voie Pénale (P)
    ASSIGNATION_PG,
    ASSIGNE_GREFF,
    EN_INSTRUCTION_P,

    /**
     * DECISION_EN_ATTENTE: Procureur hat eine Décision gesetzt
     * (Relaxion, Détention, Liberté provisoire, Sans suite, Fixation)
     * und wartet auf Bestätigung des PG.
     *
     * - P setzt Décision + drückt "Envoyer la décision au PG"
     *   → EN_INSTRUCTION_P → DECISION_EN_ATTENTE
     * - PG sieht die Décision des P und drückt "Confirmer" oder "Annuler":
     *   - Confirmer → EN_INSTRUCTION_P (Décision bestätigt, P kann weiterarbeiten)
     *   - Annuler   → EN_INSTRUCTION_P (Décision zurückgesetzt, P muss neu wählen)
     * - Solange DECISION_EN_ATTENTE → P sieht Décision read-only (keine Änderung möglich)
     */
    DECISION_EN_ATTENTE,

    /**
     * DEMANDE_MAP: Procureur hat alles gemacht (Plaignant gehört,
     * Suspect gehört, Décision vom PG bestätigt) und fragt jetzt
     * den PG ob er den MAP ausstellen darf.
     *
     * - P drückt "Demander l'autorisation MAP" → EN_INSTRUCTION_P → DEMANDE_MAP
     * - PG sieht "Confirmer MAP" oder "Annuler":
     *   - Confirmer → NOTIFICATION_MAP_P (MAP wird automatisch ausgestellt)
     *   - Annuler   → EN_INSTRUCTION_P (P muss weiter arbeiten)
     */
    DEMANDE_MAP,

    NOTIFICATION_MAP_P,
    VALIDATION_NOTIFICATION_MAP_P,  // Procureur + PG bestätigen gemeinsam, bevor PG final validiert
    MAP_VALIDE_P,
    MAPE,

    // Voie Civile (T)
    FIXE,
    ASSIGNATION_PT,
    ASSIGNE_GREFF_T,
    EN_INSTRUCTION_CH,
    NOTIFICATION_MAP_T,
    MAP_VALIDE_CH,

    // Ende (für beide Wege)
    FERME
}