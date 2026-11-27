package com.codesoupir.justicepro.controller;

import com.codesoupir.justicepro.dto.UtilisateurCreateRequest;
import com.codesoupir.justicepro.dto.UtilisateurUpdateRequest;
import com.codesoupir.justicepro.model.DocumentPersonnel;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.service.DocumentPersonnelService;
import com.codesoupir.justicepro.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UtilisateurService utilisateurService;
    private final DocumentPersonnelService documentPersonnelService;

    @GetMapping("/utilisateurs")
    public List<Utilisateur> listerUtilisateurs() {
        return utilisateurService.listerTous();
    }

    @GetMapping("/utilisateurs/{id}")
    public Utilisateur getUtilisateur(@PathVariable Long id) {
        return utilisateurService.getById(id);
    }

    @PostMapping("/utilisateurs")
    public Utilisateur creerUtilisateur(@RequestBody UtilisateurCreateRequest req) {
        System.out.println("=== CREER UTILISATEUR AUFGERUFEN, ROLE: " + req.getRole() + " ===");
        return utilisateurService.creerUtilisateur(req);
    }

    @PutMapping("/utilisateurs/{id}")
    public Utilisateur modifier(@PathVariable Long id, @RequestBody UtilisateurUpdateRequest req) {
        return utilisateurService.modifierUtilisateur(id, req);
    }

    @PutMapping("/utilisateurs/{id}/acces")
    public Utilisateur changerAcces(@PathVariable Long id, @RequestParam boolean actif) {
        return utilisateurService.changerAcces(id, actif);
    }

    @GetMapping("/utilisateurs/{id}/documents")
    public List<DocumentPersonnel> listerDocuments(@PathVariable Long id) {
        return documentPersonnelService.listerDocuments(id);
    }

    @PostMapping("/utilisateurs/{id}/documents")
    public DocumentPersonnel ajouterDocument(
            @PathVariable Long id,
            @RequestParam MultipartFile fichier,
            @RequestParam String genre,
            @RequestParam(required = false) String commentaire) throws IOException {
        return documentPersonnelService.ajouterDocument(id, fichier, genre, commentaire);
    }

    @DeleteMapping("/documents/{documentId}")
    public void supprimerDocument(@PathVariable Long documentId) throws IOException {
        documentPersonnelService.supprimerDocument(documentId);
    }

    @GetMapping("/utilisateurs/recherche")
    public List<Utilisateur> rechercherUtilisateurs(
            @RequestParam(required = false) String nom,
            @RequestParam(required = false) String matricule,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) Long instanceId,
            @RequestParam(required = false) String titre,
            @RequestParam(required = false) String typeDroit) {
        return utilisateurService.rechercherAvecFiltres(
                nom, matricule, province, instanceId, titre, typeDroit);
    }
}