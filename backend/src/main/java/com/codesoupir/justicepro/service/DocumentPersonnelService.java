package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.model.DocumentPersonnel;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.DocumentPersonnelRepository;
import com.codesoupir.justicepro.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * Verwaltung der Dokumente eines Mitarbeiters.
 * Nur vom Admin aufrufbar (Absicherung im AdminController).
 *
 * Funktioniert genauso wie PieceJointeService, aber für
 * Mitarbeiter-Dokumente statt Dossier-Pièces jointes.
 */
@Service
@RequiredArgsConstructor
public class DocumentPersonnelService {

    private final DocumentPersonnelRepository documentRepository;
    private final UtilisateurRepository utilisateurRepository;

    // Upload-Ordner für Mitarbeiter-Dokumente - getrennt von den
    // Dossier-Pièces jointes, damit die Dateien übersichtlich bleiben.
    @Value("${app.upload.dir.personnel:uploads/personnel}")
    private String uploadDir;

    /**
     * Lädt alle Dokumente eines Mitarbeiters.
     * Wird aufgerufen, wenn der Admin das Profil eines Mitarbeiters
     * öffnet (nach der Suche per Matricule).
     */
    public List<DocumentPersonnel> listerDocuments(Long utilisateurId) {
        return documentRepository.findByUtilisateurId(utilisateurId);
    }

    /**
     * Lädt eine neue Datei hoch und verknüpft sie mit einem Mitarbeiter.
     * Die Datei wird physisch auf dem Server-Dateisystem gespeichert,
     * der Pfad wird in der Datenbank gespeichert.
     *
     * Jede Datei bekommt einen einzigartigen Namen (UUID + Originalname),
     * damit 2 Dateien mit dem gleichen Namen sich nicht überschreiben.
     */
    public DocumentPersonnel ajouterDocument(Long utilisateurId, MultipartFile fichier,
                                             String genre, String commentaire) throws IOException {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable: " + utilisateurId));

        // Upload-Ordner erstellen, falls er noch nicht existiert
        Path ordner = Paths.get(uploadDir);
        if (!Files.exists(ordner)) {
            Files.createDirectories(ordner);
        }

        // Eindeutiger Dateiname mit UUID, damit keine Überschreibungen passieren
        String nomUnique = UUID.randomUUID() + "_" + fichier.getOriginalFilename();
        Path chemin = ordner.resolve(nomUnique);
        Files.copy(fichier.getInputStream(), chemin, StandardCopyOption.REPLACE_EXISTING);

        // Eintrag in der Datenbank speichern
        DocumentPersonnel doc = DocumentPersonnel.builder()
                .utilisateur(utilisateur)
                .nomFichier(fichier.getOriginalFilename())
                .genre(genre)
                .commentaire(commentaire)
                .cheminFichier(chemin.toString())
                .build();

        return documentRepository.save(doc);
    }

    /**
     * Löscht ein Dokument eines Mitarbeiters.
     * Löscht sowohl den Datenbank-Eintrag als auch die physische Datei
     * vom Server-Dateisystem, damit kein "Datei-Müll" übrig bleibt.
     */
    public void supprimerDocument(Long documentId) throws IOException {
        DocumentPersonnel doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document introuvable: " + documentId));

        // Physische Datei vom Dateisystem löschen (falls sie existiert)
        Path chemin = Paths.get(doc.getCheminFichier());
        if (Files.exists(chemin)) {
            Files.delete(chemin);
        }

        // Datenbank-Eintrag löschen
        documentRepository.delete(doc);
    }
}