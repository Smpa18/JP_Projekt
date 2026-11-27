package com.codesoupir.justicepro.config;

import com.codesoupir.justicepro.enums.Role;
import com.codesoupir.justicepro.enums.TypeInstance;
import com.codesoupir.justicepro.model.Instance;
import com.codesoupir.justicepro.model.Utilisateur;
import com.codesoupir.justicepro.repository.InstanceRepository;
import com.codesoupir.justicepro.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Läuft beim ALLERERSTEN Start und erstellt:
 *  - eine Standard-Instance ("Tripaix Matete")
 *  - einen Administrator (Matricule: ADMIN001 / Passwort: admin123)
 *
 * WICHTIG: Passwort nach dem ersten Login ändern!
 *
 * ÄNDERUNG: TypeInstance.TRIPAIX → TypeInstance.TRIBUNAL
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final InstanceRepository instanceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (utilisateurRepository.count() == 0) {

            Instance instance = new Instance();
            instance.setProvince("Kinshasa");
            instance.setVille("Kinshasa");
            // TRIBUNAL statt TRIPAIX — Enum vereinfacht
            instance.setTypeInstance(TypeInstance.TRIBUNAL);
            instance.setNomInstance("Tripaix Matete");
            instance = instanceRepository.save(instance);

            Utilisateur admin = Utilisateur.builder()
                    .numeroMatricule("ADMIN001")
                    .nom("Admin")
                    .postNom("Systeme")
                    .prenom("Super")
                    .sexe("M")
                    .motDePasse(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .instance(instance)
                    .actif(true)
                    .build();

            utilisateurRepository.save(admin);

            System.out.println("================================================");
            System.out.println(" Administrateur cree : ADMIN001 / admin123");
            System.out.println(" >>> CHANGEZ CE MOT DE PASSE IMMEDIATEMENT <<<");
            System.out.println("================================================");
        }
    }
}