package com.cafe.cafemanagement.dtos.inventory;

import com.cafe.cafemanagement.models.InventoryMovementType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class StockMovementRequest {

    private Long productId;

    private Integer quantity;

    private InventoryMovementType type;

    private String reason;
}
