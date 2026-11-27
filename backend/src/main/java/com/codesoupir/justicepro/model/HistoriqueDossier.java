package com.codesoupir.justicepro.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * Historique eines Dossiers — speichert alle Aktionen
 * die auf einem Dossier durchgeführt wurden.
 *
 * Jede Aktion erstellt eine neue Zeile in dieser Tabelle.
 */
@Entity
@Table(name = "historique_dossier")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueDossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Dossier zu dem dieser Eintrag gehört
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;

    // Datum und Uhrzeit der Aktion
    private LocalDateTime dateAction;

    // Lesbare Beschreibung der Aktion
    // z.B. "Dossier an den Procureur Général geschickt"
    private String description;

    // Name der Person die die Aktion durchgeführt hat
    private String effectuePar;

    // Stade vor und nach der Aktion
    private String stadeAvant;
    private String stadeApres;
}