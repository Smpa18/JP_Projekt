package com.codesoupir.justicepro.controller;

import com.codesoupir.justicepro.model.Instance;
import com.codesoupir.justicepro.repository.InstanceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpunkte für Instances (Gerichte/Parquets).
 *
 * GET  /api/instances              → alle Instances (eingeloggte Benutzer)
 * GET  /api/instances/province/{p} → Instances einer Province
 * POST /api/instances              → neue Instance erstellen (nur ADMIN)
 * PUT  /api/instances/{id}         → Instance bearbeiten (nur ADMIN)
 * DELETE /api/instances/{id}       → Instance löschen (nur ADMIN)
 */
@RestController
@RequestMapping("/api/instances")
@RequiredArgsConstructor
public class InstanceController {

    private final InstanceRepository instanceRepository;

    /**
     * Alle Instances laden.
     * Wird für Dropdowns auf der Administrator-Seite benutzt.
     */
    @GetMapping
    public List<Instance> getToutes() {
        return instanceRepository.findAll();
    }

    /**
     * Instances einer bestimmten Province laden.
     * Wird für den Province-Filter benutzt.
     */
    @GetMapping("/province/{province}")
    public List<Instance> getParProvince(@PathVariable String province) {
        return instanceRepository.findByProvince(province);
    }

    /**
     * Neue Instance erstellen (z.B. "Tripaix Goma").
     * Nur ADMIN darf neue Gerichte/Parquets hinzufügen.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Instance creer(@RequestBody Instance instance) {
        return instanceRepository.save(instance);
    }

    /**
     * Bestehende Instance bearbeiten.
     * Nur ADMIN darf Gerichte/Parquets bearbeiten.
     * Nützlich wenn z.B. der Name oder die Stadt geändert werden soll.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Instance modifier(@PathVariable Long id, @RequestBody Instance nouvelleInstance) {
        Instance instance = instanceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Instance introuvable: " + id));

        // Nur die Felder aktualisieren die mitgeschickt wurden
        if (nouvelleInstance.getProvince() != null) instance.setProvince(nouvelleInstance.getProvince());
        if (nouvelleInstance.getVille() != null) instance.setVille(nouvelleInstance.getVille());
        if (nouvelleInstance.getTypeInstance() != null) instance.setTypeInstance(nouvelleInstance.getTypeInstance());
        // Neue Felder: Catégorie und Branche
        if (nouvelleInstance.getCategorie() != null) instance.setCategorie(nouvelleInstance.getCategorie());
        if (nouvelleInstance.getBranche() != null) instance.setBranche(nouvelleInstance.getBranche());
        if (nouvelleInstance.getNomInstance() != null) instance.setNomInstance(nouvelleInstance.getNomInstance());

        return instanceRepository.save(instance);
    }

    /**
     * Instance löschen.
     * Nur ADMIN darf Gerichte/Parquets löschen.
     * ACHTUNG: Nur löschen wenn keine Mitarbeiter mehr dieser Instance zugeordnet sind!
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void supprimer(@PathVariable Long id) {
        instanceRepository.deleteById(id);
    }
}