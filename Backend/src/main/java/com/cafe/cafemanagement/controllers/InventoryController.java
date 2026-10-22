package com.cafe.cafemanagement.controllers;

import com.cafe.cafemanagement.dtos.inventory.InventoryMovementResponse;
import com.cafe.cafemanagement.dtos.inventory.StockMovementRequest;
import com.cafe.cafemanagement.services.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @PostMapping("/add")
    public ResponseEntity<String> addStock(@RequestBody StockMovementRequest request){
        inventoryService.addStock(request.getProductId(),request.getQuantity(),request.getType(),request.getReason());
        return ResponseEntity.ok("Stock ajouter avec succés");
    }

    @PostMapping("/remove")
    public ResponseEntity<String> removeStock(@RequestBody StockMovementRequest request){
        inventoryService.removeStock(request.getProductId(),request.getQuantity(),request.getType(),request.getReason());
        return ResponseEntity.ok("Mise a jour de stock éffectuer");
    }

    @PostMapping("/adjust")
    public ResponseEntity<String> adjustStock(@RequestBody StockMovementRequest request){
        inventoryService.adjustStock(request.getProductId(),request.getQuantity(),request.getReason());
        return ResponseEntity.ok("Le stock a été jsutifier");
    }

    @GetMapping("/movements")
    public ResponseEntity<List<InventoryMovementResponse>> getAllMovements() {
        return ResponseEntity.ok(
                inventoryService.getAllMovements()
        );
    }

    @GetMapping("/products/{productId}/movements")
    public ResponseEntity<List<InventoryMovementResponse>> getProductMovements(@PathVariable Long productId) {
        return ResponseEntity.ok(
                inventoryService.getProductMovements(productId)
        );
    }

}
