package com.cafe.cafemanagement.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cafe.cafemanagement.models.InventoryMovement;
import com.cafe.cafemanagement.models.InventoryMovementType;

@Repository
public interface InventoryRepository extends JpaRepository<InventoryMovement, Long> {

    List<InventoryMovement> findByProductIdOrderByCreatedAtDesc(Long productId);

    List<InventoryMovement> findAllByOrderByCreatedAtDesc();

    List<InventoryMovement> findByType(InventoryMovementType type);

    List<InventoryMovement> findByTypeOrderByCreatedAtDesc(
            InventoryMovementType type
    );
}
