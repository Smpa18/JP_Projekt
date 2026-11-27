package com.codesoupir.justicepro.controller;

import com.codesoupir.justicepro.model.Ville;
import com.codesoupir.justicepro.repository.VilleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpunkte für Städte der DRC.
 *
 * GET /api/villes         → alle Städte (öffentlich - für Dropdowns)
 * GET /api/villes?province=X → Städte einer Province
 * POST /api/villes        → neue Stadt hinzufügen (nur ADMIN)
 * DELETE /api/villes/{id} → Stadt löschen (nur ADMIN)
 */
@RestController
@RequestMapping("/api/villes")
@RequiredArgsConstructor
public class VilleController {

    private final VilleRepository villeRepository;

    /**
     * Alle Städte laden, optional gefiltert nach Province.
     * Öffentlich zugänglich - wird für Dropdowns auf der
     * Administrator-Seite benutzt (kein Login nötig).
     * Temporäres Log zum Debuggen: zeigt Anzahl der Städte in der Konsole.
     */
    @GetMapping
    public List<Ville> listerVilles(
            @RequestParam(required = false) String province) {

        // Temporäres Log zum Debuggen - zeigt wie viele Städte in der DB sind
        System.out.println("=== VILLES TOTAL IN DB: " + villeRepository.count());

        if (province != null && !province.isBlank()) {
            List<Ville> result = villeRepository.findByProvinceOrderByNomAsc(province);
            System.out.println("=== VILLES FOR PROVINCE " + province + ": " + result.size());
            return result;
        }

        List<Ville> result = villeRepository.findAllByOrderByProvinceAscNomAsc();
        System.out.println("=== VILLES ALL: " + result.size());
        return result;
    }

    /**
     * Neue Stadt hinzufügen.
     * Nur für ADMIN - andere Rollen können keine Städte hinzufügen.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Ville ajouterVille(@RequestBody Ville ville) {
        return villeRepository.save(ville);
    }

    /**
     * Stadt löschen.
     * Nur für ADMIN - andere Rollen können keine Städte löschen.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void supprimerVille(@PathVariable Long id) {
        villeRepository.deleteById(id);
    }
}