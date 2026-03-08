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
        return resumeRepository.findAllByUserId(userId);
    }
    
    @Override
    public Resume createResume(Resume resume, String userId) throws ExecutionException, InterruptedException {
        logger.debug("Creating resume for user: {}", userId);
        
        resume.setId(UUID.randomUUID().toString());
        resume.setUserId(userId);
        resume.setCreatedAt(Instant.now());
        resume.setUpdatedAt(Instant.now());
        
        return resumeRepository.save(resume);
    }
    
    @Override
    public Resume getResumeById(String id, String userId) throws ExecutionException, InterruptedException {
        logger.debug("Getting resume {} for user {}", id, userId);
        
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with id: " + id));
        
        if (!resume.getUserId().equals(userId)) {
            throw new UnauthorizedException("You don't have permission to access this resume");
        }
        
        return resume;
    }
    
    @Override
    public Resume updateResume(String id, Resume resume, String userId) throws ExecutionException, InterruptedException {
        logger.debug("Updating resume {} for user {}", id, userId);
        
        // Verify resume exists and belongs to user
        Resume existing = getResumeById(id, userId);
        
        existing.setTitle(resume.getTitle() != null ? resume.getTitle() : existing.getTitle());
        existing.setPersonalInfo(resume.getPersonalInfo() != null ? resume.getPersonalInfo() : existing.getPersonalInfo());
        existing.setSummary(resume.getSummary() != null ? resume.getSummary() : existing.getSummary());
        existing.setExperience(resume.getExperience() != null ? resume.getExperience() : existing.getExperience());
        existing.setProjects(resume.getProjects() != null ? resume.getProjects() : existing.getProjects());
        existing.setEducation(resume.getEducation() != null ? resume.getEducation() : existing.getEducation());
        existing.setSkills(resume.getSkills() != null ? resume.getSkills() : existing.getSkills());
        existing.setCertifications(resume.getCertifications() != null ? resume.getCertifications() : existing.getCertifications());
        existing.setLanguages(resume.getLanguages() != null ? resume.getLanguages() : existing.getLanguages());
        existing.setUpdatedAt(Instant.now());

        return resumeRepository.save(existing);
    }
    
    @Override
    public void deleteResume(String id, String userId) throws ExecutionException, InterruptedException {
        logger.debug("Deleting resume {} for user {}", id, userId);

        // Verify exists
        getResumeById(id, userId);

        resumeRepository.deleteById(id);
    }

    @Override
    public void deleteAllByUserId(String userId) throws ExecutionException, InterruptedException {
        logger.info("Deleting all resumes for user {}", userId);
        List<Resume> resumes = resumeRepository.findAllByUserId(userId);
        resumeRepository.deleteAllByIds(
            resumes.stream()
                .filter(r -> r != null && r.getId() != null)
                .map(Resume::getId)
                .toList()
        );
        logger.info("Deleted {} resumes for user {}", resumes.size(), userId);
    }
}
