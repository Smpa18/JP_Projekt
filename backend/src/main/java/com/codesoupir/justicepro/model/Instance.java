package com.codesoupir.justicepro.model;

import com.codesoupir.justicepro.enums.TypeInstance;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Eine "Instance" ist ein konkretes Gericht / eine Behörde,
 * z.B. "Tripaix Matete" in Kinshasa.
 * Wird benutzt für:
 *  - Mitarbeiter (Affectation -> welchem Gericht zugeordnet)
 *  - Dossiers (welches Gericht ist zuständig)
 *
 * FELDER:
 *  - province: z.B. "Kinshasa"
 *  - ville: z.B. "Kinshasa"
 *  - typeInstance: TRIBUNAL oder PARQUET
 *  - categorie: z.B. "Tribunal de grande instance", "Tribunal de paix"
 *  - branche: z.B. "Magistrature du siège", "Magistrature debout"
 *  - nomInstance: z.B. "Tripaix Matete"
 *
 * ÄNDERUNGEN:
 *  - TypeInstance vereinfacht zu TRIBUNAL / PARQUET
 *  - Neue Felder: categorie, branche
 */
@Entity
@Table(name = "instances")
@Getter
@Setter
@NoArgsConstructor
public class Instance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Geografische Zuordnung
    private String province;   // z.B. "Kinshasa"
    private String ville;      // z.B. "Kinshasa"

    // Art der Instance: TRIBUNAL oder PARQUET
    @Enumerated(EnumType.STRING)
    private TypeInstance typeInstance;

    // Kategorie der Instance
    // z.B. "Tribunal de grande instance", "Tribunal de paix",
    //      "Parquet de grande instance", "Parquet de paix"
    private String categorie;

    // Branche der Instance
    // z.B. "Magistrature du siège", "Magistrature debout"
    private String branche;

    // Name der Instance
    // z.B. "Tripaix Matete", "TGI Goma"
    private String nomInstance;
}