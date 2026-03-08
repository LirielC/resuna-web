package com.resuna.repository;

import com.resuna.exception.ResourceNotFoundException;
import com.resuna.model.ATSAnalysisResult;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * In-memory implementation of ATSAnalysisRepository for development.
 */
@Repository
@Profile("dev")
public class InMemoryATSAnalysisRepository implements ATSAnalysisRepository {
    
    private final Map<String, ATSAnalysisResult> storage = new ConcurrentHashMap<>();
    
    @Override
    public ATSAnalysisResult save(ATSAnalysisResult analysis) {
        if (analysis.getId() == null) {
            analysis.setId(UUID.randomUUID().toString());
        }
        storage.put(analysis.getId(), analysis);
        return analysis;
    }
    
    @Override
    public Optional<ATSAnalysisResult> findById(String id) {
        return Optional.ofNullable(storage.get(id));
    }
    
    @Override
    public List<ATSAnalysisResult> findByResumeId(String resumeId, String userId) {
        return storage.values().stream()
                .filter(a -> a.getResumeId().equals(resumeId) && a.getUserId().equals(userId))
                .sorted(Comparator.comparing(ATSAnalysisResult::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }
    
    @Override
    public List<ATSAnalysisResult> findByUserId(String userId) {
        return storage.values().stream()
                .filter(a -> a.getUserId().equals(userId))
                .sorted(Comparator.comparing(ATSAnalysisResult::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }
    
    @Override
    public Optional<ATSAnalysisResult> findLatestByResumeId(String resumeId, String userId) {
        return storage.values().stream()
                .filter(a -> a.getResumeId().equals(resumeId) && a.getUserId().equals(userId))
                .max(Comparator.comparing(ATSAnalysisResult::getCreatedAt));
    }
    
    @Override
    public void delete(String id, String userId) {
        ATSAnalysisResult analysis = storage.get(id);
        if (analysis == null) {
            throw new ResourceNotFoundException("Analysis not found with id: " + id);
        }
        if (!analysis.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Analysis not found with id: " + id);
        }
        storage.remove(id);
    }

    @Override
    public void deleteAllByUserId(String userId) {
        storage.values().removeIf(a -> a.getUserId().equals(userId));
    }
}
