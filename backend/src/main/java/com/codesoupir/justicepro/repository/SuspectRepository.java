package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.Suspect;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuspectRepository extends JpaRepository<Suspect, Long> {
}