package com.storyreview.repository;

import com.storyreview.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findFirstByEmailIgnoreCaseAndCodeOrderByCreatedAtDesc(String email, String code);

    @Modifying
    @Query("UPDATE OtpCode o SET o.used = true WHERE o.email = :email AND o.used = false")
    int invalidateUnusedForEmail(@Param("email") String email);

    @Modifying
    @Query("UPDATE OtpCode o SET o.used = true WHERE o.id = :id AND o.used = false")
    int markUsed(@Param("id") Long id);
}
