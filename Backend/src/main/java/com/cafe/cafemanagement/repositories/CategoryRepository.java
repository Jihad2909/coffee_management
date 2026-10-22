package com.cafe.cafemanagement.repositories;

import com.cafe.cafemanagement.dtos.category.CategorySimpleResponse;
import com.cafe.cafemanagement.models.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {


    @Query("""
        SELECT new com.cafe.cafemanagement.dtos.category.CategorySimpleResponse(
            c.id,
            c.name
        )
        From Category c
    """)
    List<CategorySimpleResponse> getCategories();

}
