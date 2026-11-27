package com.codesoupir.justicepro.controller;

import com.codesoupir.justicepro.model.Barreau;
import com.codesoupir.justicepro.repository.BarreauRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpunkte für Barreaux (Anwaltsvereinigungen) der DRC.
 *
 * GET  /api/barreaux              → alle Barreaux (eingeloggte Benutzer)
 * GET  /api/barreaux?province=X   → Barreaux einer Province
 * POST /api/barreaux              → neuen Barreau hinzufügen (nur ADMIN)
 * DELETE /api/barreaux/{id}       → Barreau löschen (nur ADMIN)
 */
@RestController
@RequestMapping("/api/barreaux")
@RequiredArgsConstructor
public class BarreauController {

    private final BarreauRepository barreauRepository;

    /**
     * Alle Barreaux laden, optional gefiltert nach Province.
     * Wird beim Laden der Administrator-Seite aufgerufen.
     * Ohne Parameter: alle Barreaux aller Provinces.
     * Mit province: nur Barreaux dieser Province.
     */
    @GetMapping
    public List<Barreau> listerBarreaux(
            @RequestParam(required = false) String province) {
        if (province != null && !province.isBlank()) {
            return barreauRepository.findByProvinceOrderByNomAsc(province);
        }
        return barreauRepository.findAllByOrderByProvinceAscNomAsc();
    }

    /**
     * Neuen Barreau hinzufügen.
     * Nur ADMIN darf neue Barreaux hinzufügen.
     * Body: { "province": "Kinshasa", "nom": "Barreau de Kinshasa/Gombe" }
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Barreau ajouterBarreau(@RequestBody Barreau barreau) {
        return barreauRepository.save(barreau);
    }

    /**
     * Barreau löschen.
     * Nur ADMIN darf Barreaux löschen.
     * ACHTUNG: Nur löschen wenn keine Avocats diesem Barreau zugeordnet sind!
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void supprimerBarreau(@PathVariable Long id) {
        barreauRepository.deleteById(id);
    }
}