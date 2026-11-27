package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.dto.PersonneDTO;
import com.codesoupir.justicepro.dto.PlainteCreateRequest;
import com.codesoupir.justicepro.enums.Stade;
import com.codesoupir.justicepro.enums.StatutDossier;
import com.codesoupir.justicepro.enums.TypeDroit;
import com.codesoupir.justicepro.model.*;
import com.codesoupir.justicepro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Service zum Erstellen einer neuen Plainte.
 * Wird vom PlainteController aufgerufen wenn der Greffier
 * eine neue Plainte erfasst (POST /api/plaintes).
 */
@Service
@RequiredArgsConstructor
public class PlainteService {

    private final DossierRepository dossierRepository;
    private final PlainteRepository plainteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CurrentUserService currentUserService;

    /**
     * Erstellt eine neue Plainte und ein zugehöriges Dossier.
     * Gibt die gespeicherte Plainte zurück (wird vom Controller zurückgegeben).
     *
     * ABLAUF:
     *  1. Neues Dossier erstellen mit Stade=ENREGISTRE
     *  2. Dossier-Nummer generieren: DOS-YYYY-XXXXXX
     *  3. Instance des Greffiers zuweisen
     *  4. Plaignant aus PersonneDTO erstellen
     *  5. Suspects aus Liste erstellen
     *  6. Plainte erstellen und mit Dossier verknüpfen
     *  7. Alles speichern
     */
    @Transactional
    public Plainte enregistrerPlainte(PlainteCreateRequest req) {

        // ----- Eingeloggten Greffier laden -----
        Utilisateur greffier = currentUserService.getUtilisateurConnecte();

        // ----- Dossier erstellen -----
        Dossier dossier = new Dossier();
        dossier.setStade(Stade.ENREGISTRE);
        dossier.setStatut(StatutDossier.ACTIF);
        dossier.setDroit(TypeDroit.PENAL);
        dossier.setDateCreation(LocalDate.now());

        // Temporäre Nummer setzen damit JPA die ID generiert
        dossier.setNumeroDossier("DOS-TEMP");
        dossier = dossierRepository.save(dossier);

        // Echte Nummer generieren: DOS-YYYY-000001
        String numero = String.format("DOS-%s-%06d",
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy")),
                dossier.getId());
        dossier.setNumeroDossier(numero);

        // Instance des Greffiers zuweisen — automatisch aus seinem Profil
        if (greffier.getInstance() != null) {
            dossier.setInstance(greffier.getInstance());
        }

        // ----- Plaignant erstellen -----
        // PersonneDTO → Plaignant Objekt
        Plaignant plaignant = new Plaignant();
        if (req.getPlaignant() != null) {
            plaignant = mapPersonneToplaignant(req.getPlaignant());
        }

        // ----- Suspects erstellen -----
        // Neue Methode: suspects (Liste) hat Vorrang vor suspect (einzeln)
        List<Suspect> suspectList = new ArrayList<>();
        if (req.getSuspects() != null && !req.getSuspects().isEmpty()) {
            // Neue Methode: Liste von Suspects
            for (PersonneDTO dto : req.getSuspects()) {
                suspectList.add(mapPersonneToSuspect(dto));
            }
        } else if (req.getSuspect() != null) {
            // Alte Methode: einzelner Suspect (Rückwärtskompatibilität)
            suspectList.add(mapPersonneToSuspect(req.getSuspect()));
        }

        // ----- Plainte erstellen -----
        Plainte plainte = new Plainte();
        plainte.setDossier(dossier);
        plainte.setPlaignant(plaignant);
        plainte.setSuspects(suspectList);
        plainte.setDescriptionPlainte(req.getDescriptionPlainte());

        // ----- Avocats zuweisen (alter Weg per ID — Rückwärtskompatibilität) -----
        if (req.getAvocatPlaignantId() != null) {
            utilisateurRepository.findById(req.getAvocatPlaignantId())
                    .ifPresent(a -> plainte.setAvocatsPlaignant(List.of(a)));
        }
        if (req.getAvocatSuspectId() != null) {
            utilisateurRepository.findById(req.getAvocatSuspectId())
                    .ifPresent(a -> plainte.setAvocatsSuspect(List.of(a)));
        }

        // ----- Alles speichern -----
        dossierRepository.save(dossier);
        return plainteRepository.save(plainte);
    }

    /**
     * Gibt eine Plainte anhand ihrer ID zurück.
     * Wird vom Controller für den PDF-Download benutzt.
     */
    public Plainte getById(Long id) {
        return plainteRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Plainte introuvable: " + id));
    }

    /**
     * Wandelt ein PersonneDTO in einen Plaignant um.
     * Alle Felder werden übernommen — nur nom ist Pflichtfeld.
     */
    private Plaignant mapPersonneToplaignant(PersonneDTO dto) {
        Plaignant p = new Plaignant();
        p.setNom(dto.getNom());
        p.setPostNom(dto.getPostNom());
        p.setPrenom(dto.getPrenom());
        p.setSexe(dto.getSexe());
        p.setDateNaissance(dto.getDateNaissance());
        p.setLieuNaissance(dto.getLieuNaissance());
        p.setVillageOrigine(dto.getVillageOrigine());
        p.setSecteur(dto.getSecteur());
        p.setTerritoire(dto.getTerritoire());
        p.setAssistance(dto.isAssistance());
        p.setEtatCivil(dto.getEtatCivil());
        p.setNomPere(dto.getNomPere());
        p.setNomMere(dto.getNomMere());
        p.setNombreEnfants(dto.getNombreEnfants());
        p.setNumeroTelephone(dto.getNumeroTelephone());
        p.setAdresseEmail(dto.getAdresseEmail());
        // Adresse und Nationalität
        p.setAdresse(dto.getAdresse());
        p.setNationalite(dto.getNationalite());
        // Bildung und Beruf
        p.setNiveauEtude(dto.getNiveauEtude());
        p.setProfession(dto.getProfession());
        return p;
    }

    /**
     * Wandelt ein PersonneDTO in einen Suspect um.
     * Alle Felder werden übernommen — nur nom ist Pflichtfeld.
     */
    private Suspect mapPersonneToSuspect(PersonneDTO dto) {
        Suspect s = new Suspect();
        s.setNom(dto.getNom());
        s.setPostNom(dto.getPostNom());
        s.setPrenom(dto.getPrenom());
        s.setSexe(dto.getSexe());
        s.setDateNaissance(dto.getDateNaissance());
        s.setLieuNaissance(dto.getLieuNaissance());
        s.setVillageOrigine(dto.getVillageOrigine());
        s.setSecteur(dto.getSecteur());
        s.setTerritoire(dto.getTerritoire());
        s.setAssistance(dto.isAssistance());
        s.setEtatCivil(dto.getEtatCivil());
        s.setNomPere(dto.getNomPere());
        s.setNomMere(dto.getNomMere());
        s.setNombreEnfants(dto.getNombreEnfants());
        s.setNumeroTelephone(dto.getNumeroTelephone());
        s.setAdresseEmail(dto.getAdresseEmail());
        // Adresse und Nationalität
        s.setAdresse(dto.getAdresse());
        s.setNationalite(dto.getNationalite());
        // Bildung und Beruf
        s.setNiveauEtude(dto.getNiveauEtude());
        s.setProfession(dto.getProfession());
        return s;
    }
}