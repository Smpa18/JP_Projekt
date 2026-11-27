package com.codesoupir.justicepro.enums;

/**
 * Rechtsbereich einer Plainte / eines Dossiers.
 * Wird vom Greffier bei "Classifier" gesetzt.
 */
public enum TypeDroit {
    PENAL,  // "P" - geht an den Procureur Général (PG)
    CIVIL   // "T" - geht an den Président du Tribunal (PT)
}