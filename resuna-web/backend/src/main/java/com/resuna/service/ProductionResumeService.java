package com.resuna.service;

import com.resuna.exception.ResourceNotFoundException;
import com.resuna.exception.UnauthorizedException;
import com.resuna.model.Resume;
import com.resuna.repository.ResumeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

/**
 * Production ResumeService using Firestore.
 */
@Service
@Profile("!dev")
public class ProductionResumeService implements ResumeService {
    
    private static final Logger logger = LoggerFactory.getLogger(ProductionResumeService.class);
    
    private final ResumeRepository resumeRepository;
    
    public ProductionResumeService(ResumeRepository resumeRepository) {
        this.resumeRepository = resumeRepository;
    }
    
    @Override
    public List<Resume> getAllResumes(String userId) throws ExecutionException, InterruptedException {
        logger.debug("Getting all resumes for user: {}", userId);
        requireUserId(userId);
        return resumeRepository.findAllByUserId(userId);
    }
    
    @Override
    public Resume createResume(Resume resume, String userId) throws ExecutionException, InterruptedException {
        logger.debug("Creating resume for user: {}", userId);

        requireUserId(userId);
        if (resume == null) {
            throw new IllegalArgumentException("Resume is required");
        }
        Instant now = Instant.now();
        resume.setId(UUID.randomUUID().toString());
        resume.setUserId(userId);
        resume.setCreatedAt(now);
        resume.setUpdatedAt(now);

        return resumeRepository.save(resume);
    }
    
    @Override
    public Resume getResumeById(String id, String userId) throws ExecutionException, InterruptedException {
        logger.debug("Getting resume {} for user {}", id, userId);
        requireUserId(userId);
        requireResumeId(id);
        
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with id: " + id));
        
        if (!userId.equals(resume.getUserId())) {
            throw new UnauthorizedException("You don't have permission to access this resume");
        }
        
        return resume;
    }
    
    @Override
    public Resume updateResume(String id, Resume resume, String userId) throws ExecutionException, InterruptedException {
        logger.debug("Updating resume {} for user {}", id, userId);
        requireUserId(userId);
        requireResumeId(id);
        if (resume == null) {
            throw new IllegalArgumentException("Resume is required");
        }
        
        // Verify resume exists and belongs to user
        Resume existing = getResumeById(id, userId);
        
        copyProvidedFields(resume, existing);
        existing.setUpdatedAt(Instant.now());

        return resumeRepository.save(existing);
    }
    
    @Override
    public void deleteResume(String id, String userId) throws ExecutionException, InterruptedException {
        logger.debug("Deleting resume {} for user {}", id, userId);
        requireUserId(userId);

        // Verify exists
        getResumeById(id, userId);

        resumeRepository.deleteById(id);
    }

    @Override
    public void deleteAllByUserId(String userId) throws ExecutionException, InterruptedException {
        logger.info("Deleting all resumes for user {}", userId);
        requireUserId(userId);
        List<Resume> resumes = resumeRepository.findAllByUserId(userId);
        resumeRepository.deleteAllByIds(
            resumes.stream()
                .filter(r -> r != null && r.getId() != null)
                .map(Resume::getId)
                .toList()
        );
        logger.info("Deleted {} resumes for user {}", resumes.size(), userId);
    }

    private void requireUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new UnauthorizedException("User not authenticated");
        }
    }

    private void requireResumeId(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Resume id is required");
        }
    }

    private void copyProvidedFields(Resume source, Resume target) {
        if (source.getTitle() != null) target.setTitle(source.getTitle());
        if (source.getLanguage() != null) target.setLanguage(source.getLanguage());
        if (source.getPersonalInfo() != null) target.setPersonalInfo(source.getPersonalInfo());
        if (source.getSummary() != null) target.setSummary(source.getSummary());
        if (source.getExperience() != null) target.setExperience(source.getExperience());
        if (source.getProjects() != null) target.setProjects(source.getProjects());
        if (source.getEducation() != null) target.setEducation(source.getEducation());
        if (source.getSkills() != null) target.setSkills(source.getSkills());
        if (source.getSkillGroups() != null) target.setSkillGroups(source.getSkillGroups());
        if (source.getCertifications() != null) target.setCertifications(source.getCertifications());
        if (source.getLanguages() != null) target.setLanguages(source.getLanguages());
    }
}
