package com.resuna.service;

import com.resuna.exception.ResourceNotFoundException;
import com.resuna.model.ATSAnalysisRequest;
import com.resuna.model.ATSAnalysisResult;
import com.resuna.model.ATSScore;
import com.resuna.model.Resume;
import com.resuna.repository.ATSAnalysisRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Service for ATS analysis operations.
 */
@Service
public class ATSService {
    
    private static final Logger logger = LoggerFactory.getLogger(ATSService.class);
    
    private final ATSAnalysisRepository analysisRepository;
    private final ResumeService resumeService;
    private final ATSAnalysisEngine analysisEngine;
    
    public ATSService(ATSAnalysisRepository analysisRepository,
                     ResumeService resumeService,
                     ATSAnalysisEngine analysisEngine) {
        this.analysisRepository = analysisRepository;
        this.resumeService = resumeService;
        this.analysisEngine = analysisEngine;
    }
    
    /**
     * Analyze resume against job description.
     */
    public ATSAnalysisResult analyze(ATSAnalysisRequest request, String userId) throws Exception {
        logger.info("Starting ATS analysis");

        // Get the resume — prefer inline body (local-first), fall back to Firestore lookup
        Resume resume;
        if (request.getResume() != null) {
            resume = request.getResume();
            if (resume.getUserId() == null) resume.setUserId(userId);
        } else if (request.getResumeId() != null && !request.getResumeId().isBlank()) {
            resume = resumeService.getResumeById(request.getResumeId(), userId);
        } else {
            throw new IllegalArgumentException("Either 'resume' or 'resumeId' must be provided");
        }
        
        // Perform analysis using the engine
        ATSAnalysisResult result = analysisEngine.analyze(resume, request);
        
        // Set metadata
        result.setId(UUID.randomUUID().toString());
        result.setUserId(userId);
        result.setResumeId(request.getResumeId());
        result.setJobTitle(request.getJobTitle());
        result.setCompany(request.getCompany());
        result.setJobDescription(request.getJobDescription());
        result.setCreatedAt(Instant.now());
        
        // Save analysis result
        analysisRepository.save(result);
        
        logger.info("ATS analysis completed with score: {}", result.getScore());
        return result;
    }
    
    /**
     * Quick analysis without resume lookup (for testing).
     */
    public ATSAnalysisResult analyzeResume(Resume resume, ATSAnalysisRequest request) {
        logger.info("Quick ATS analysis for inline resume");
        return analysisEngine.analyze(resume, request);
    }
    
    /**
     * Get ATS score summary for a resume (from latest analysis).
     */
    public ATSScore getScore(String resumeId, String userId) {
        Optional<ATSAnalysisResult> latestAnalysis = 
                analysisRepository.findLatestByResumeId(resumeId, userId);
        
        if (latestAnalysis.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No ATS analysis found for resume: " + resumeId);
        }
        
        ATSAnalysisResult analysis = latestAnalysis.get();
        
        ATSScore score = new ATSScore();
        score.setResumeId(resumeId);
        score.setJobTitle(analysis.getJobTitle());
        score.setScore(analysis.getScore());
        score.setMatchedKeywords(analysis.getMatches() != null ? analysis.getMatches().size() : 0);
        score.setTotalKeywords((analysis.getMatches() != null ? analysis.getMatches().size() : 0) + 
                              (analysis.getGaps() != null ? analysis.getGaps().size() : 0));
        score.setAnalyzedAt(analysis.getCreatedAt());
        return score;
    }
    
    /**
     * Get all analyses for a specific resume.
     */
    public List<ATSAnalysisResult> getAnalysesByResumeId(String resumeId, String userId) {
        return analysisRepository.findByResumeId(resumeId, userId);
    }
    
    /**
     * Get all analyses for a user.
     */
    public List<ATSAnalysisResult> getAnalysesByUserId(String userId) {
        return analysisRepository.findByUserId(userId);
    }
    
    /**
     * Delete an analysis.
     */
    public void deleteAnalysis(String analysisId, String userId) {
        analysisRepository.delete(analysisId, userId);
    }

    /**
     * Extract keywords from a job description, organized by category.
     * Free operation — no credits or AI call required.
     */
    public Map<String, List<String>> extractKeywords(String jobDescription) {
        return analysisEngine.extractKeywordsFromJobDescription(jobDescription);
    }
}
