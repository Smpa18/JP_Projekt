package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.dto.ChangerMotDePasseRequest;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Verwaltet das eigene Profil des eingeloggten Benutzers.
 * Im Gegensatz zu UtilisateurService (nur für ADMIN) kann hier
 * JEDER eingeloggte Benutzer SEIN EIGENES Passwort ändern.
 */
@Service
@RequiredArgsConstructor
public class ProfilService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    /**
     * Ändert das Passwort des AKTUELL eingeloggten Benutzers.
     * Das alte Passwort muss korrekt angegeben werden (Sicherheit).
     */
    public void changerMotDePasse(ChangerMotDePasseRequest req) {
        Utilisateur user = currentUserService.getUtilisateurConnecte();

        // Prüfen, ob das angegebene ALTE Passwort tatsächlich stimmt
        boolean ancienCorrect = passwordEncoder.matches(
                req.getAncienMotDePasse(), user.getMotDePasse());

        if (!ancienCorrect) {
            throw new BadCredentialsException("L'ancien mot de passe est incorrect.");
        }

        if (req.getNouveauMotDePasse() == null || req.getNouveauMotDePasse().isBlank()) {
            throw new IllegalArgumentException("Le nouveau mot de passe ne peut pas être vide.");
        }

        user.setMotDePasse(passwordEncoder.encode(req.getNouveauMotDePasse()));
        utilisateurRepository.save(user);
    }
}