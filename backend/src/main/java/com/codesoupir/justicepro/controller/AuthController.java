package com.codesoupir.justicepro.controller;

import com.codesoupir.justicepro.dto.LoginRequest;
import com.codesoupir.justicepro.dto.LoginResponse;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.UtilisateurRepository;
import com.codesoupir.justicepro.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Endpunkte für Authentifizierung.
 *
 * POST /api/auth/login → Login mit Matricule + Passwort → gibt JWT-Token zurück
 * GET  /api/auth/me    → gibt den eingeloggten Benutzer zurück (aus JWT-Token)
 *                        Wird benutzt um zu prüfen ob der Benutzer ADMIN ist.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * Login mit Matricule + Passwort.
     * Gibt einen JWT-Token zurück der bei allen weiteren Anfragen
     * im Authorization-Header mitgeschickt werden muss.
     */
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /**
     * Gibt den eingeloggten Benutzer zurück.
     * Der Benutzer wird aus dem JWT-Token gelesen (via Spring Security).
     * Wird vom Frontend benutzt um zu prüfen ob der Benutzer ADMIN ist
     * und entsprechend den "Modifier"-Button anzuzeigen oder zu verstecken.
     *
     * Authentication wird von Spring Security automatisch gefüllt —
     * getName() gibt das Matricule des eingeloggten Benutzers zurück.
     */
    @GetMapping("/me")
    public Utilisateur me(Authentication authentication) {
        // Matricule aus dem JWT-Token lesen
        String matricule = authentication.getName();
        // Benutzer aus der Datenbank laden und zurückgeben
        return utilisateurRepository.findByNumeroMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }
}