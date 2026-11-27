package com.codesoupir.justicepro.dto;

import com.codesoupir.justicepro.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Antwort nach erfolgreichem Login - enthält das JWT-Token
 * und die wichtigsten Benutzerdaten die das Frontend braucht.
 *
 * id wurde hinzugefügt damit das Frontend den eingeloggten
 * Benutzer mit Dossier-Zuweisungen vergleichen kann
 * (z.B. ob dossier.procureurId === user.id, um zu prüfen ob
 * der Procureur sein eigenes Dossier bearbeiten darf).
 */
@Data
@AllArgsConstructor
public class LoginResponse {
    private Long id;       // ID des Benutzers (für Frontend-Filter)
    private String token;
    private String nom;
    private String prenom;
    private Role role;
}