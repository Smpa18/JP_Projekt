package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.dto.UtilisateurCreateRequest;
import com.codesoupir.justicepro.dto.UtilisateurUpdateRequest;
import com.codesoupir.justicepro.model.Instance;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.InstanceRepository;
import com.codesoupir.justicepro.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Verwaltung der Mitarbeiter (Seite "Administration").
 * Nur für Benutzer mit Rolle ADMIN erreichbar (siehe AdminController).
 *
 * AVOCAT-Sonderfall:
 *  - Kein Matricule (null statt leerem String - wichtig für UNIQUE constraint!)
 *  - Kein echtes Passwort (Avocats loggen sich nie ein)
 *  - barreau + numeroOrdre statt Matricule
 */
@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final InstanceRepository instanceRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Sucht Mitarbeiter per Matricule-Nummer (Teilstring-Suche).
     */
    public List<Utilisateur> rechercherParMatricule(String suchbegriff) {
        return utilisateurRepository.findByNumeroMatriculeContainingIgnoreCase(suchbegriff);
    }

    /**
     * Sucht Mitarbeiter mit optionalen Filtern für die Administrator-Seite.
     */
    public List<Utilisateur> rechercherAvecFiltres(
            String nom,
            String matricule,
            String province,
            Long instanceId,
            String titre,
            String typeDroit) {

        return utilisateurRepository.findAll().stream()
                .filter(u -> {
                    if (nom != null && !nom.isBlank()) {
                        String vollname = String.join(" ",
                                u.getNom() != null ? u.getNom() : "",
                                u.getPostNom() != null ? u.getPostNom() : "",
                                u.getPrenom() != null ? u.getPrenom() : ""
                        ).toLowerCase();
                        if (!vollname.contains(nom.toLowerCase())) return false;
                    }
                    if (matricule != null && !matricule.isBlank()) {
                        if (u.getNumeroMatricule() == null ||
                                !u.getNumeroMatricule().toLowerCase()
                                        .contains(matricule.toLowerCase())) return false;
                    }
                    if (province != null && !province.isBlank()) {
                        if (u.getInstance() == null ||
                                u.getInstance().getProvince() == null ||
                                !u.getInstance().getProvince().toLowerCase()
                                        .contains(province.toLowerCase())) return false;
                    }
                    if (instanceId != null) {
                        if (u.getInstance() == null ||
                                !u.getInstance().getId().equals(instanceId)) return false;
                    }
                    if (titre != null && !titre.isBlank()) {
                        if (u.getTitre() == null ||
                                !u.getTitre().equalsIgnoreCase(titre)) return false;
                    }
                    if (typeDroit != null && !typeDroit.isBlank()) {
                        if (u.getTypeDroit() == null ||
                                !u.getTypeDroit().name().equalsIgnoreCase(typeDroit)) return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    /**
     * Lädt einen einzelnen Mitarbeiter anhand seiner ID.
     */
    public Utilisateur getById(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable: " + id));
    }

    /**
     * Legt einen neuen Mitarbeiter an ("Ajouter un personnel").
     *
     * AVOCAT-Sonderfall:
     *  - numeroMatricule = null (nicht leerer String!) damit UNIQUE constraint
     *    nicht verletzt wird wenn mehrere Avocats erstellt werden.
     *    PostgreSQL erlaubt mehrere NULL-Werte in UNIQUE Spalten.
     *  - Passwort wird automatisch generiert (Avocats kennen es nicht)
     *  - barreau + numeroOrdre werden gespeichert
     */
    public Utilisateur creerUtilisateur(UtilisateurCreateRequest req) {
        Instance instance = req.getInstanceId() != null
                ? instanceRepository.findById(req.getInstanceId())
                .orElseThrow(() -> new EntityNotFoundException("Instance introuvable"))
                : null;

        String motDePasseHache = (req.getMotDePasse() != null && !req.getMotDePasse().isBlank())
                ? passwordEncoder.encode(req.getMotDePasse())
                : passwordEncoder.encode("COMPTE_DESACTIVE_" + System.currentTimeMillis());

        /**
         * WICHTIG: leeren String als null speichern!
         * Bei Avocats kommt "" vom Frontend - das würde den UNIQUE constraint
         * verletzen wenn mehrere Avocats erstellt werden (mehrere leere Strings
         * sind NICHT erlaubt, aber mehrere NULL-Werte schon).
         */
        String matricule = (req.getNumeroMatricule() == null || req.getNumeroMatricule().isBlank())
                ? null : req.getNumeroMatricule();

        Utilisateur u = Utilisateur.builder()
                .numeroMatricule(matricule)
                .nom(req.getNom())
                .postNom(req.getPostNom())
                .prenom(req.getPrenom())
                .sexe(req.getSexe())
                .dateNaissance(req.getDateNaissance())
                .lieuNaissance(req.getLieuNaissance())
                .motDePasse(motDePasseHache)
                .role(req.getRole())
                .typeDroit(req.getTypeDroit())
                .grade(req.getGrade())
                .titre(req.getTitre())
                .diplome(req.getDiplome())
                .universite(req.getUniversite())
                .secteur(req.getSecteur())
                .villageOrigine(req.getVillageOrigine())
                .districtOrigine(req.getDistrictOrigine())
                .instance(instance)
                .barreau(req.getBarreau())
                .numeroOrdre(req.getNumeroOrdre())
                .actif(true)
                .build();

        return utilisateurRepository.save(u);
    }

    /**
     * Bearbeitet einen bestehenden Mitarbeiter ("Modifier / Enregistrer").
     */
    public Utilisateur modifierUtilisateur(Long id, UtilisateurUpdateRequest req) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable: " + id));

        if (req.getNom() != null) u.setNom(req.getNom());
        if (req.getPostNom() != null) u.setPostNom(req.getPostNom());
        if (req.getPrenom() != null) u.setPrenom(req.getPrenom());
        if (req.getSexe() != null) u.setSexe(req.getSexe());
        if (req.getDateNaissance() != null) u.setDateNaissance(req.getDateNaissance());
        if (req.getLieuNaissance() != null) u.setLieuNaissance(req.getLieuNaissance());
        if (req.getRole() != null) u.setRole(req.getRole());
        if (req.getTypeDroit() != null) u.setTypeDroit(req.getTypeDroit());
        if (req.getGrade() != null) u.setGrade(req.getGrade());
        if (req.getTitre() != null) u.setTitre(req.getTitre());
        if (req.getBarreau() != null) u.setBarreau(req.getBarreau());
        if (req.getNumeroOrdre() != null) u.setNumeroOrdre(req.getNumeroOrdre());
        if (req.getDiplome() != null) u.setDiplome(req.getDiplome());
        if (req.getUniversite() != null) u.setUniversite(req.getUniversite());
        if (req.getSecteur() != null) u.setSecteur(req.getSecteur());
        if (req.getVillageOrigine() != null) u.setVillageOrigine(req.getVillageOrigine());
        if (req.getDistrictOrigine() != null) u.setDistrictOrigine(req.getDistrictOrigine());

        if (req.getMotDePasse() != null && !req.getMotDePasse().isBlank()) {
            u.setMotDePasse(passwordEncoder.encode(req.getMotDePasse()));
        }

        if (req.getInstanceId() != null) {
            Instance nouvelleInstance = instanceRepository.findById(req.getInstanceId())
                    .orElseThrow(() -> new EntityNotFoundException("Instance introuvable"));
            u.setInstance(nouvelleInstance);
        }

        return utilisateurRepository.save(u);
    }

    /**
     * Aktiviert oder deaktiviert den Zugriff eines Mitarbeiters.
     */
    public Utilisateur changerAcces(Long utilisateurId, boolean actif) {
        Utilisateur u = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        u.setActif(actif);
        return utilisateurRepository.save(u);
    }

    /**
     * Listet alle Mitarbeiter auf ohne Filterung.
     */
    public List<Utilisateur> listerTous() {
        return utilisateurRepository.findAll();
    }
}