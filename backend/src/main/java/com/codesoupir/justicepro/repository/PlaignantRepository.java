package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.Plaignant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaignantRepository extends JpaRepository<Plaignant, Long> {
}