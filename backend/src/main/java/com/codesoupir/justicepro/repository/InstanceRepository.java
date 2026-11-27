package com.codesoupir.justicepro.repository;

import com.codesoupir.justicepro.model.Instance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InstanceRepository extends JpaRepository<Instance, Long> {

    // Für die Dropdowns "Province -> Ville -> Instance"
    List<Instance> findByProvince(String province);
    List<Instance> findByProvinceAndVille(String province, String ville);
}