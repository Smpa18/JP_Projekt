package com.codesoupir.justicepro.dto;

import lombok.Data;
import java.time.LocalDate;

/** Formular "Fermeture de procédure / Condamner". */
@Data
public class VerdictRequest {
    private String texteVerdict;

    private boolean condamnation;
    private boolean sursis;
    private boolean liberteProvisoire;
    private boolean miseEnLiberte;
    private boolean incarceration;

    // nur relevant wenn incarceration = true
    private String lieuIncarceration;
    private LocalDate incarcerationDe;
    private LocalDate incarcerationA;
}