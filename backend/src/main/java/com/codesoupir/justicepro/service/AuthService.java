package com.codesoupir.justicepro.service;

import com.codesoupir.justicepro.dto.LoginRequest;
import com.codesoupir.justicepro.dto.LoginResponse;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.UtilisateurRepository;
import com.codesoupir.justicepro.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

/**
 * Prüft Login-Daten und erstellt im Erfolgsfall ein JWT-Token.
 * Gibt alle wichtigen Benutzerdaten zurück die das Frontend braucht,
 * inklusive der ID für den Procureur-Filter in ActionsEnAttente.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtUtil jwtUtil;

    /**
     * Prüft Matricule + Passwort gegen die Datenbank.
     * Bei Erfolg: erstellt ein JWT-Token und gibt Benutzerdaten zurück.
     * Bei Fehler: wirft BadCredentialsException.
     *
     * WICHTIG: id wird jetzt mitgeschickt damit das Frontend
     * (ActionsEnAttente.jsx) filtern kann ob ein Dossier dem
     * eingeloggten Procureur persönlich zugewiesen ist.
     */
    public LoginResponse login(LoginRequest request) {
        try {
            // Authentifizierung gegen Spring Security (prüft Passwort-Hash)
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getNumeroMatricule(), request.getMotDePasse())
            );
        } catch (Exception e) {
            throw new BadCredentialsException("Numéro de matricule ou mot de passe incorrect.");
        }

        // Benutzer aus der Datenbank laden (für id, nom, prenom, role)
        Utilisateur u = utilisateurRepository.findByNumeroMatricule(request.getNumeroMatricule())
                .orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable."));

        // JWT-Token generieren (enthält Matricule + Role als Claims)
        String token = jwtUtil.genererToken(u.getNumeroMatricule(), u.getRole().name());

        // id wird jetzt mitzurückgegeben (neu!)
        return new LoginResponse(u.getId(), token, u.getNom(), u.getPrenom(), u.getRole());
    }
}