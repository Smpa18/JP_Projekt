package com.codesoupir.justicepro.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Eine Stadt in einer Provinz der DRC.
 * Wird für die Province/Stadt-Dropdowns auf der Administrator-Seite benutzt.
 * Der Admin kann neue Städte direkt in der App hinzufügen.
 *
 * Beispiel: province="Kinshasa", nom="Matete"
 *
 * Trennung der Verantwortlichkeiten:
 *  - Ville:    Städte (dynamisch, vom Admin verwaltbar)
 *  - Instance: Gerichte/Parquets (haben eine Stadt + Province)
 */
@Entity
@Table(name = "villes")
@Getter
@Setter
@NoArgsConstructor
public class Ville {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Provinz der Stadt (z.B. "Kinshasa", "Nord-Kivu")
    // Muss exakt mit den 26 Provinznamen übereinstimmen
    @Column(nullable = false)
    private String province;

    // Stadtname (z.B. "Matete", "Goma")
    @Column(nullable = false)
    private String nom;
}