package com.codesoupir.justicepro.enums;

/**
 * Sichtbarkeit einer Annotation (Notiz) zu einem Dossier.
 * PUBLIQUE     -> alle Mitarbeiter können lesen
 * PERSONNELLE  -> NUR der Autor selbst kann seine eigenen lesen
 */
public enum TypeAnnotation {
    PUBLIQUE,
    PERSONNELLE
}