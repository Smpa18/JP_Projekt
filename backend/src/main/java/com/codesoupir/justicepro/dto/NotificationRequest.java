package com.codesoupir.justicepro.dto;

import com.codesoupir.justicepro.enums.TypeNotification;
import lombok.Data;

/** Emission von MC / MA / AR / MAP. */
@Data
public class NotificationRequest {
    private TypeNotification type;
    private String lieu; // nur relevant bei MAP, z.B. "Pr. Makala"
}