package com.codesoupir.justicepro.dto;

import com.codesoupir.justicepro.enums.TypeDroit;
import lombok.Data;

@Data
public class DossierInfosRequest {
    private String qualification;
    private TypeDroit droit;
    private boolean relaxion;
    private boolean detention;
    private boolean liberteProvisoire;
    private boolean sansSuite;
    private boolean fixation;
}