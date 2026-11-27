package com.codesoupir.justicepro.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

/**
 * Eine hochgeladene Datei (Pièce jointe) zu einem Dossier,
 * z.B. "Preuve d'achat de maison".
 */
@Entity
@Table(name = "pieces_jointes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PieceJointe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;

    private String nomFichier; // ursprünglicher Dateiname
    private String chemin;     // Speicherpfad auf der Festplatte

    private String genre;      // z.B. "Preuve de paiement"
    private String commentaire;

    private LocalDate dateAjout;

    @ManyToOne
    @JoinColumn(name = "ajoute_par_id")
    private Utilisateur ajoutePar;

    @PrePersist
    public void prePersist() {
        if (dateAjout == null) {
            dateAjout = LocalDate.now();
        }
    }
}