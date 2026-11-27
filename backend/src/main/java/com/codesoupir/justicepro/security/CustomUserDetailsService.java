package com.codesoupir.justicepro.security;

import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Lädt einen Benutzer anhand des "Numéro Matricule" für Spring Security.
 * Die Rolle wird als "ROLE_<ROLLE>" hinzugefügt
 * (wird z.B. für @PreAuthorize("hasRole('ADMIN')") benötigt).
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    @Override
    public UserDetails loadUserByUsername(String numeroMatricule) {
        Utilisateur u = utilisateurRepository.findByNumeroMatricule(numeroMatricule)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Aucun utilisateur avec ce numéro de matricule: " + numeroMatricule));

        if (!u.isActif()) {
            throw new DisabledException("Ce compte a été désactivé.");
        }

        return new User(
                u.getNumeroMatricule(),
                u.getMotDePasse(),
                List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name()))
        );
    }
}