package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Liefert den aktuell EINGELOGGTEN Benutzer (aus dem JWT-Token).
 * Wird in fast jedem Service benötigt - z.B. um zu wissen,
 * welcher Greffier eine Plainte registriert hat.
 */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UtilisateurRepository utilisateurRepository;

    public Utilisateur getUtilisateurConnecte() {
        // SecurityContextHolder enthält den Benutzer aus dem JwtAuthFilter
        String numeroMatricule = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        return utilisateurRepository.findByNumeroMatricule(numeroMatricule)
                .orElseThrow(() -> new IllegalStateException("Benutzer nicht gefunden."));
    }
}