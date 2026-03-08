package com.resuna.service;

import com.resuna.exception.ResourceNotFoundException;
import com.resuna.exception.UnauthorizedException;
import com.resuna.model.Resume;
import com.resuna.repository.InMemoryResumeRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Resume service for development mode using in-memory storage.
 */
@Service
@Profile("dev")
public class DevResumeService implements ResumeService {

    private final InMemoryResumeRepository repository;

    public DevResumeService(InMemoryResumeRepository repository) {
        this.repository = repository;
    }

    public List<Resume> getAllResumes(String userId) {
        return repository.findAllByUserId(userId);
    }

    public Resume getResumeById(String id, String userId) {
        Resume resume = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with id: " + id));

        if (!resume.getUserId().equals(userId)) {
            throw new UnauthorizedException("You don't have permission to access this resume");
        }

        return resume;
    }

    public Resume createResume(Resume resume, String userId) {
        resume.setUserId(userId);
        resume.setId(null);
        return repository.save(resume);
    }

    public Resume updateResume(String id, Resume resumeUpdate, String userId) {
        Resume existingResume = getResumeById(id, userId);

        existingResume.setTitle(resumeUpdate.getTitle());
        existingResume.setPersonalInfo(resumeUpdate.getPersonalInfo());
        existingResume.setSummary(resumeUpdate.getSummary());
        existingResume.setExperience(resumeUpdate.getExperience());
        existingResume.setProjects(resumeUpdate.getProjects());
        existingResume.setEducation(resumeUpdate.getEducation());
        existingResume.setSkills(resumeUpdate.getSkills());
        existingResume.setCertifications(resumeUpdate.getCertifications());
        existingResume.setLanguages(resumeUpdate.getLanguages());

        return repository.save(existingResume);
    }

    public void deleteResume(String id, String userId) {
        getResumeById(id, userId);
        repository.deleteById(id);
    }

    public void deleteAllByUserId(String userId) {
        repository.findAllByUserId(userId).forEach(r -> {
            if (r != null && r.getId() != null) repository.deleteById(r.getId());
        });
    }
}
