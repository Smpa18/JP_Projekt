package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.dto.DossierInfosRequest;
import com.codesoupir.justicepro.dto.DossierListDTO;
import com.codesoupir.justicepro.enums.Role;
import com.codesoupir.justicepro.enums.Stade;
import com.codesoupir.justicepro.enums.StatutDossier;
import com.codesoupir.justicepro.enums.TypeDroit;
import com.codesoupir.justicepro.model.Dossier;
import com.codesoupir.justicepro.model.Plainte;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.DossierRepository;
import com.codesoupir.justicepro.repository.PlainteRepository;
import com.codesoupir.justicepro.repository.VerdictRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DossierService {

    private final DossierRepository dossierRepository;
    private final VerdictRepository verdictRepository;
    private final PlainteRepository plainteRepository;

    /**
     * Gibt ein Dossier anhand seiner ID zurück.
     * Wirft EntityNotFoundException wenn nicht gefunden.
     */
    public Dossier getById(Long id) {
        return dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier introuvable: " + id));
    }

    /**
     * Gibt die Plainte zu einem Dossier zurück.
     * Wirft EntityNotFoundException wenn keine Plainte verknüpft ist.
     */
    public Plainte getPlainteByDossierId(Long dossierId) {
        return plainteRepository.findByDossier_Id(dossierId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucune plainte associée à ce dossier: " + dossierId));
    }

    /**
     * Hauptmethode für die Dossier-Suche.
     * Kombiniert optionale Suchfilter mit rollenspezifischen Sichtbarkeits-Regeln.
     *
     * SICHTBARKEITS-REGELN:
     *  - ADMIN             → sieht ALLE Dossiers aller Instances (nur lesen)
     *  - PROCUREUR_GENERAL → sieht nur droit=PENAL seiner eigenen Instance
     *  - PROCUREUR         → sieht ALLE Dossiers seiner eigenen Instance
     *                         (Access). Bearbeiten kann er trotzdem nur
     *                         die ihm persönlich zugewiesenen Dossiers —
     *                         das steuert das Frontend über die Action-
     *                         Buttons (nicht diese Sichtbarkeits-Regel hier).
     *  - GREFFIER          → sieht ENREGISTRE + FERME seiner eigenen Instance:
     *                         ENREGISTRE = Dossiers die noch bei ihm sind
     *                         FERME = geschlossene Dossiers zur Konsultation
     *  - PRESIDENT_TRIBUNAL → sieht aktuell NICHTS (Tribunal-Teil noch nicht gebaut)
     *  - JUGE_INSTRUCTION  → sieht alle Dossiers (Regel noch nicht entschieden)
     *
     * ZUKÜNFTIGE ERWEITERUNGEN:
     *  - PRESIDENT_TRIBUNAL: soll später nur droit=CIVIL seiner Instance sehen
     *  - JUGE_INSTRUCTION: soll später nur die ihm zugewiesenen Dossiers sehen
     */
    public List<DossierListDTO> rechercher(String numero, LocalDate dateDe, LocalDate dateA,
                                           StatutDossier statut, String procureur,
                                           String jugeInstruction, String nomPlaignant,
                                           String province, String instance,
                                           Utilisateur utilisateurConnecte) {

        Specification<Dossier> spec = (root, query, cb) -> cb.conjunction();

        // ----- Suchfilter (nur aktiv wenn Feld ausgefüllt) -----

        if (numero != null && !numero.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("numeroDossier")), "%" + numero.toLowerCase() + "%"));
        }
        if (dateDe != null) {
            spec = spec.and((root, q, cb) ->
                    cb.greaterThanOrEqualTo(root.get("dateCreation"), dateDe));
        }
        if (dateA != null) {
            spec = spec.and((root, q, cb) ->
                    cb.lessThanOrEqualTo(root.get("dateCreation"), dateA));
        }
        if (statut != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("statut"), statut));
        }
        if (procureur != null && !procureur.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("procureur").get("nom")), "%" + procureur.toLowerCase() + "%"));
        }
        if (jugeInstruction != null && !jugeInstruction.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("jugeInstruction").get("nom")), "%" + jugeInstruction.toLowerCase() + "%"));
        }
        if (province != null && !province.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("instance").get("province")), "%" + province.toLowerCase() + "%"));
        }
        if (instance != null && !instance.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("instance").get("nomInstance")), "%" + instance.toLowerCase() + "%"));
        }

        // ================================================================
        // SICHTBARKEITS-REGELN
        // ================================================================

        // ----- REGEL 1: ADMIN sieht ALLE Dossiers (Lesemodus) -----
        // Keine Einschränkung nach Instance oder Stade.
        if (utilisateurConnecte != null && utilisateurConnecte.getRole() == Role.ADMIN) {
            return filtrerParPlaignant(dossierRepository.findAll(spec), nomPlaignant);
        }

        // ----- REGEL 2: PROCUREUR_GENERAL sieht nur droit=PENAL seiner Instance -----
        // Er überwacht das gesamte Parquet-Verfahren seiner Instance.
        // Civil-Dossiers (Tribunal) sind für ihn NICHT sichtbar.
        if (utilisateurConnecte != null && utilisateurConnecte.getRole() == Role.PROCUREUR_GENERAL) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("droit"), TypeDroit.PENAL));
            if (utilisateurConnecte.getInstance() != null) {
                spec = spec.and((root, q, cb) ->
                        cb.equal(root.get("instance").get("id"),
                                utilisateurConnecte.getInstance().getId()));
            }
        }

        // ----- REGEL 3: PROCUREUR sieht ALLE Dossiers seiner Instance -----
        // Bearbeiten (Action-Buttons) kann er trotzdem nur seine eigenen
        // zugewiesenen Dossiers — das wird im Frontend gesteuert.
        if (utilisateurConnecte != null && utilisateurConnecte.getRole() == Role.PROCUREUR) {
            if (utilisateurConnecte.getInstance() != null) {
                spec = spec.and((root, q, cb) ->
                        cb.equal(root.get("instance").get("id"),
                                utilisateurConnecte.getInstance().getId()));
            }
        }

        // ----- REGEL 4: GREFFIER sieht ENREGISTRE + FERME seiner Instance -----
        // ENREGISTRE: Dossiers die noch bei ihm sind und bearbeitet werden müssen
        // FERME: geschlossene Dossiers zur Konsultation/Archiv
        if (utilisateurConnecte != null && utilisateurConnecte.getRole() == Role.GREFFIER) {
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.equal(root.get("stade"), Stade.ENREGISTRE),
                    cb.equal(root.get("stade"), Stade.FERME)
            ));
            if (utilisateurConnecte.getInstance() != null) {
                spec = spec.and((root, q, cb) ->
                        cb.equal(root.get("instance").get("id"),
                                utilisateurConnecte.getInstance().getId()));
            }
        }

        // ----- REGEL 5: PRESIDENT_TRIBUNAL sieht aktuell NICHTS -----
        // Tribunal-Teil (Voie Civile) ist noch NICHT implementiert.
        // ZUKÜNFTIG: soll nur droit=CIVIL seiner eigenen Instance sehen.
        if (utilisateurConnecte != null && utilisateurConnecte.getRole() == Role.PRESIDENT_TRIBUNAL) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("id"), -1L));
        }

        // ----- REGEL 6: Alle anderen Rollen (JUGE_INSTRUCTION etc.) -----
        // Sehen aktuell ALLE Dossiers.

        return filtrerParPlaignant(dossierRepository.findAll(spec), nomPlaignant);
    }

    /**
     * Suche für die Seite "Tous les dossiers".
     * KEINE rollenspezifische Sichtbarkeits-Einschränkung — ALLE Rollen
     * sehen ALLE Dossiers aller Instances. Nur zum LESEN/KONSULTIEREN.
     *
     * Archivierte Dossiers (FERME + 5 Jahre) erscheinen ebenfalls hier
     * und werden im DTO als archive=true markiert — das Frontend zeigt
     * sie mit einem grauen "Archivé" Badge an.
     */
    public List<DossierListDTO> rechercherTous(String numero, LocalDate dateDe, LocalDate dateA,
                                               StatutDossier statut, String procureur,
                                               String jugeInstruction, String nomPlaignant,
                                               String province, String instance) {

        Specification<Dossier> spec = (root, query, cb) -> cb.conjunction();

        if (numero != null && !numero.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("numeroDossier")), "%" + numero.toLowerCase() + "%"));
        }
        if (dateDe != null) {
            spec = spec.and((root, q, cb) ->
                    cb.greaterThanOrEqualTo(root.get("dateCreation"), dateDe));
        }
        if (dateA != null) {
            spec = spec.and((root, q, cb) ->
                    cb.lessThanOrEqualTo(root.get("dateCreation"), dateA));
        }
        if (statut != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("statut"), statut));
        }
        if (procureur != null && !procureur.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("procureur").get("nom")), "%" + procureur.toLowerCase() + "%"));
        }
        if (jugeInstruction != null && !jugeInstruction.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("jugeInstruction").get("nom")), "%" + jugeInstruction.toLowerCase() + "%"));
        }
        if (province != null && !province.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("instance").get("province")), "%" + province.toLowerCase() + "%"));
        }
        if (instance != null && !instance.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("instance").get("nomInstance")), "%" + instance.toLowerCase() + "%"));
        }

        return filtrerParPlaignant(dossierRepository.findAll(spec), nomPlaignant);
    }

    /**
     * Filtert die Dossier-Liste nach dem Nom du Plaignant.
     * Da Dossier keine direkte Relation zu Plainte hat,
     * suchen wir über PlainteRepository nach passenden Plaignants
     * und filtern dann die Dossier-Liste nach deren IDs.
     */
    private List<DossierListDTO> filtrerParPlaignant(List<Dossier> dossiers, String nomPlaignant) {
        if (nomPlaignant == null || nomPlaignant.isBlank()) {
            return dossiers.stream().map(this::toListDTO).toList();
        }

        List<Long> dossierIds = plainteRepository.findAll().stream()
                .filter(p -> p.getPlaignant() != null
                        && p.getPlaignant().getNom() != null
                        && p.getPlaignant().getNom().toLowerCase()
                        .contains(nomPlaignant.toLowerCase()))
                .map(p -> p.getDossier().getId())
                .toList();

        return dossiers.stream()
                .filter(d -> dossierIds.contains(d.getId()))
                .map(this::toListDTO)
                .toList();
    }

    /**
     * Wandelt ein Dossier in ein schlankes DTO um für die Tabellen.
     *
     * ARCHIV-LOGIK:
     * Ein Dossier gilt als "archiviert" wenn:
     *  1. Stade = FERME (geschlossen)
     *  2. dateFermeture ist mehr als 5 Jahre her
     * → archive=true wird im Frontend (TousDossiers.jsx) als
     *   grauer "Archivé" Badge angezeigt.
     *
     * Enthält auch procureurId damit das Frontend bei PROCUREUR
     * filtern kann ob das Dossier ihm persönlich zugewiesen ist.
     */
    private DossierListDTO toListDTO(Dossier d) {
        Boolean condamnation = verdictRepository.findByDossierId(d.getId())
                .map(v -> v.getCondamnation())
                .orElse(null);

        // ----- Archiv-Berechnung: FERME + mehr als 5 Jahre -----
        // dateFermeture.isBefore(heute minus 5 Jahre) = vor mehr als 5 Jahren geschlossen
        boolean archive = d.getStatut() == StatutDossier.FERME
                && d.getDateFermeture() != null
                && d.getDateFermeture().isBefore(LocalDate.now().minusYears(5));

        return new DossierListDTO(
                d.getId(),
                d.getNumeroDossier(),
                d.getDateCreation(),
                d.getProcureur() != null ? d.getProcureur().getNom() : null,
                d.getProcureur() != null ? d.getProcureur().getId() : null,
                d.getChambre(),
                d.getJugeInstruction() != null ? d.getJugeInstruction().getNom() : null,
                condamnation,
                d.getStade(),
                d.getStatut(),
                d.getDateFermeture(),
                archive
        );
    }

    /**
     * Aktualisiert die Info-Felder eines Dossiers.
     * Wenn der PG explizit ein droit (PENAL/CIVIL) setzt, wird
     * classifie=true gesetzt — ab dann erscheint "Classification"
     * im Frontend mit dem echten Wert statt "-".
     */
    public Dossier mettreAJourInfos(Long id, DossierInfosRequest req) {
        Dossier d = getById(id);
        d.setQualification(req.getQualification());
        if (req.getDroit() != null) {
            d.setDroit(req.getDroit());
            d.setClassifie(true);
        }
        d.setRelaxion(req.isRelaxion());
        d.setDetention(req.isDetention());
        d.setLiberteProvisoire(req.isLiberteProvisoire());
        d.setSansSuite(req.isSansSuite());
        d.setFixation(req.isFixation());
        return dossierRepository.save(d);
    }
}