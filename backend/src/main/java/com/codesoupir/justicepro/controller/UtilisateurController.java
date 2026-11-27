package com.codesoupir.justicepro.controller;

import com.codesoupir.justicepro.enums.Role;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.UtilisateurRepository;
import com.codesoupir.justicepro.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Endpunkte für die Mitarbeiter-Suche.
 * Für ALLE eingeloggten Benutzer erreichbar (kein @PreAuthorize nötig).
 *
 * GET /api/utilisateurs/recherche         → Suche per Matricule
 * GET /api/utilisateurs/recherche-avocat  → Autocomplete per Numéro de l'ordre
 * GET /api/utilisateurs/avocats           → Alle Avocats (für Avocats-Tab)
 * GET /api/utilisateurs/personnel         → Alle Nicht-Avocats (für Personnel-Tab)
 */
@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * Suche per Numéro de matricule.
     */
    @GetMapping("/recherche")
    public List<Utilisateur> rechercher(@RequestParam String matricule) {
        return utilisateurService.rechercherParMatricule(matricule);
    }

    /**
     * Autocomplete für Avocats per Numéro de l'ordre.
     * Wird im Plainte-Formular benutzt während der Greffier tippt.
     */
    @GetMapping("/recherche-avocat")
    public List<Utilisateur> rechercherAvocat(@RequestParam String numeroOrdre) {
        return utilisateurRepository
                .findByNumeroOrdreContainingIgnoreCaseAndRole(numeroOrdre, Role.AVOCAT);
    }

    /**
     * Alle Avocats laden - für ALLE eingeloggten Benutzer erreichbar.
     * Wird im Administrator-Tab "Avocats" benutzt damit auch Greffier
     * und andere Rollen die Avocats sehen können (ohne Admin-Rechte).
     */
    @GetMapping("/avocats")
    public List<Utilisateur> listerAvocats() {
        return utilisateurRepository.findByRole(Role.AVOCAT);
    }

    /**
     * Alle Nicht-Avocats laden - für ALLE eingeloggten Benutzer erreichbar.
     * Wird im Administrator-Tab "Personnel" benutzt damit auch Greffier
     * und andere Rollen das Personal sehen können (ohne Admin-Rechte).
     * Avocats werden automatisch herausgefiltert.
     */
    @GetMapping("/personnel")
    public List<Utilisateur> listerPersonnel() {
        return utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() != Role.AVOCAT)
                .collect(Collectors.toList());
    }
}