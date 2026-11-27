package com.codesoupir.justicepro.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Der Kläger ("Plaignant") in einer Plainte.
 * Erbt alle Felder von Person (nom, prenom, dateNaissance...).
 */
@Entity
@Table(name = "plaignants")
@Getter
@Setter
@NoArgsConstructor
public class Plaignant extends Person {
    // Aktuell keine zusätzlichen Felder nötig
}