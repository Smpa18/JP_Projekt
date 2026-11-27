package com.codesoupir.justicepro.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Ein Barreau (Anwaltsvereinigung) in der DRC.
 * Wird für das Barreau-Dropdown beim Hinzufügen eines Avocats benutzt.
 * Der Admin kann neue Barreaux direkt in der App hinzufügen.
 *
 * Beispiel: province="Kinshasa", nom="Barreau de Kinshasa/Gombe"
 *
 * In der DRC gibt es ca. 26 Barreaux — einen pro Provinz.
 * Manche Provinzen haben mehrere Barreaux (z.B. Kinshasa hat 2).
 */
@Entity
@Table(name = "barreaux")
@Getter
@Setter
@NoArgsConstructor
public class Barreau {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Provinz des Barreaux (z.B. "Kinshasa", "Nord-Kivu").
     * Muss exakt mit den 26 Provinznamen übereinstimmen.
     */
    @Column(nullable = false)
    private String province;

    /**
     * Name des Barreaux (z.B. "Barreau de Kinshasa/Gombe").
     */
    @Column(nullable = false)
    private String nom;
}