package com.website.backend.repository;

import com.website.backend.entity.ShippingSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShippingSettingRepository extends JpaRepository<ShippingSetting, Long> {
}
