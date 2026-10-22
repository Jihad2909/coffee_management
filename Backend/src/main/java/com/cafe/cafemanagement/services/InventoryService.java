package com.cafe.cafemanagement.services;

import com.cafe.cafemanagement.dtos.inventory.InventoryMovementResponse;
import com.cafe.cafemanagement.models.InventoryMovement;
import com.cafe.cafemanagement.models.InventoryMovementType;
import com.cafe.cafemanagement.models.Products;
import com.cafe.cafemanagement.repositories.InventoryRepository;
import com.cafe.cafemanagement.repositories.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;


    @Transactional
    public void addStock(Long productId, Integer quantity, InventoryMovementType type, String reason){

        if (quantity == null || quantity <= 0){
            throw new RuntimeException("Quantity need to be greater than 0 ");
        }

        if (type != InventoryMovementType.PURCHASE && type != InventoryMovementType.RETURN) {
            throw new RuntimeException("Invalid movement type for stock addition");
        }

        Products prod = productRepository.findById(productId).orElseThrow(()-> new RuntimeException("Product Not Found "+ productId));

        prod.setStock(prod.getStock() + quantity);
        productRepository.save(prod);

        InventoryMovement movement = new InventoryMovement();

        movement.setProduct(prod);
        movement.setQuantity(quantity);
        movement.setType(type);
        movement.setReason(reason);

        inventoryRepository.save(movement);



    }

    @Transactional
    public void removeStock(Long productId, Integer quantity, InventoryMovementType type, String reason){

        if (quantity == null || quantity <= 0){
            throw new RuntimeException("La quantité doit etre superieur de 0 ");
        }

        if (type != InventoryMovementType.WASTE && type != InventoryMovementType.SALE) {
            throw new RuntimeException("Invalid movement type for stock addition");
        }

        Products prod = productRepository.findById(productId).orElseThrow(()-> new RuntimeException("Produit non trouvé "+ productId));

        if(prod.getStock() <= quantity){
            throw new RuntimeException("Stock insufficient de produit :"+prod.getName()+". exist : "+prod.getStock());
        }


        prod.setStock(prod.getStock() - quantity);
        productRepository.save(prod);

        InventoryMovement movement = new InventoryMovement();

        movement.setProduct(prod);
        movement.setQuantity(quantity);
        movement.setType(type);
        movement.setReason(reason);

        inventoryRepository.save(movement);

    }

    @Transactional
    public void adjustStock(Long productId, Integer quantity, String reason) {

        if (quantity == null || quantity == 0) {
            throw new RuntimeException(
                    "Adjustment quantity cannot be zero"
            );
        }

        Products product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with id: "
                                        + productId
                        )
                );

        int newStock = product.getStock() + quantity;

        if (newStock < 0) {
            throw new RuntimeException(
                    "Stock cannot be negative"
            );
        }

        product.setStock(newStock);

        productRepository.save(product);

        InventoryMovement movement = new InventoryMovement();

        movement.setQuantity(quantity);
        movement.setType(
                InventoryMovementType.ADJUSTMENT
        );
        movement.setReason(reason);
        movement.setProduct(product);

        inventoryRepository.save(movement);
    }

    public List<InventoryMovementResponse> getAllMovements() {

        return inventoryRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<InventoryMovementResponse> getProductMovements(
            Long productId
    ) {

        return inventoryRepository
                .findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }





    private InventoryMovementResponse toResponse(
            InventoryMovement movement
    ) {

        return new InventoryMovementResponse(
                movement.getId(),
                movement.getProduct().getId(),
                movement.getProduct().getName(),
                movement.getQuantity(),
                movement.getType(),
                movement.getReason(),
                movement.getCreatedAt()
        );
    }


}
