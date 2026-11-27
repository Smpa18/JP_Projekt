package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.model.Dossier;
import com.codesoupir.justicepro.model.PieceJointe;
import com.codesoupir.justicepro.repository.DossierRepository;
import com.codesoupir.justicepro.repository.PieceJointeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

/**
 * Verwaltet hochgeladene Dateien (Pièces jointes).
 * Dateien werden LOKAL auf der Festplatte gespeichert
 * (kein Cloud-Speicher nötig - passend für die Offline-Installation).
 */
@Service
@RequiredArgsConstructor
public class PieceJointeService {

    private final PieceJointeRepository pieceJointeRepository
            ;
    private final DossierRepository dossierRepository;
    private final CurrentUserService currentUserService;

    // Ordner, in dem alle Dateien gespeichert werden
    private static final String UPLOAD_DIR = "uploads/pieces";

    public PieceJointe ajouterPiece(Long dossierId, MultipartFile fichier,
                                    String genre, String commentaire) throws IOException {

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new EntityNotFoundException("Dossier introuvable"));

        Path ordner = Paths.get(UPLOAD_DIR);
        if (!Files.exists(ordner)) {
            Files.createDirectories(ordner);
        }

        // Eindeutigen Dateinamen erzeugen (Original-Name bleibt erhalten)
        String nomUnique = UUID.randomUUID() + "_" + fichier.getOriginalFilename();
        Path chemin = ordner.resolve(nomUnique);
        Files.copy(fichier.getInputStream(), chemin, StandardCopyOption.REPLACE_EXISTING);

        PieceJointe piece = PieceJointe.builder()
                .dossier(dossier)
                .nomFichier(fichier.getOriginalFilename())
                .chemin(chemin.toString())
                .genre(genre)
                .commentaire(commentaire)
                .ajoutePar(currentUserService.getUtilisateurConnecte())
                .build();

        return pieceJointeRepository.save(piece);
    }

    public List<PieceJointe> listerPieces(Long dossierId) {
        return pieceJointeRepository.findByDossierId(dossierId);
    }

    public void supprimerPiece(Long pieceId) throws IOException {
        PieceJointe piece = pieceJointeRepository.findById(pieceId)
                .orElseThrow(() -> new EntityNotFoundException("Pièce introuvable"));

        Files.deleteIfExists(Paths.get(piece.getChemin()));
        pieceJointeRepository.delete(piece);
    }

    /**
     * Gibt eine Pièce jointe anhand ihrer ID zurück.
     * Wird für den Download-Endpunkt benutzt.
     */
    public PieceJointe getPieceById(Long pieceId) {
        return pieceJointeRepository.findById(pieceId)
                .orElseThrow(() -> new EntityNotFoundException("Pièce introuvable"));
    }
}