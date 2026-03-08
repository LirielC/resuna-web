package com.resuna.repository;

import com.resuna.model.ATSAnalysisResult;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for ATS analysis operations.
 */
public interface ATSAnalysisRepository {
    
    /**
     * Save an ATS analysis result.
     */
    ATSAnalysisResult save(ATSAnalysisResult analysis);
    
    /**
     * Find an analysis by ID.
     */
    Optional<ATSAnalysisResult> findById(String id);
    
    /**
     * Find all analyses for a specific resume.
     */
    List<ATSAnalysisResult> findByResumeId(String resumeId, String userId);
    
    /**
     * Find all analyses for a user.
     */
    List<ATSAnalysisResult> findByUserId(String userId);
    
    /**
     * Get the latest analysis for a resume.
     */
    Optional<ATSAnalysisResult> findLatestByResumeId(String resumeId, String userId);
    
    /**
     * Delete an analysis.
     */
    void delete(String id, String userId);

    /**
     * Delete all analyses for a user (used during account deletion).
     */
    void deleteAllByUserId(String userId) throws Exception;
}
