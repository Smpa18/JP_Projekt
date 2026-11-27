package com.codesoupir.justicepro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

/**
 * Ein offizielles Dokument eines Mitarbeiters (Zeugnis, Diplom, etc.).
 * Wird vom Admin hochgeladen und dem Mitarbeiter-Profil zugeordnet.
 *
 * Beispiele: Schulzeugnis, Universitätsdiplom, Magistrats-Zertifikat,
 * Beförderungsurkunde, Personalausweis-Kopie, usw.
 *
 * Die Datei selbst wird auf dem Server-Dateisystem gespeichert
 * (wie bei PieceJointe), nur der Pfad wird in der Datenbank gehalten.
 */
@Entity
@Table(name = "documents_personnel")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentPersonnel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Der Mitarbeiter, zu dem dieses Dokument gehört.
    // Wenn der Mitarbeiter gelöscht wird, werden auch seine Dokumente gelöscht.
    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    // Originaler Dateiname (z.B. "diplome_universite_kinshasa.pdf")
    private String nomFichier;

    // Genre/Typ des Dokuments (z.B. "Diplôme", "Certificat", "Attestation")
    private String genre;

    // Kommentar/Beschreibung (optional, z.B. "Diplôme de droit 2015")
    private String commentaire;

    // Datum des Uploads - wird automatisch beim Speichern gesetzt
    private LocalDate dateAjout;

    // Pfad zur Datei auf dem Server-Dateisystem
    // (wie bei PieceJointe - Datei wird physisch gespeichert)
    private String cheminFichier;

    // Wird automatisch vor dem ersten Speichern aufgerufen
    @PrePersist
    public void prePersist() {
        if (dateAjout == null) {
            dateAjout = LocalDate.now();
        }
    }
}