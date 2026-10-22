package com.cafe.cafemanagement.dtos.inventory;

import com.cafe.cafemanagement.models.InventoryMovementType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor

public class InventoryMovementResponse {
    private Long id;

    private Long productId;

    private String productName;

    private Integer quantity;

    private InventoryMovementType type;

    private String reason;

    private LocalDateTime createdAt;
}
