package com.resuna.service;

import com.resuna.model.Resume;

import java.util.List;
import java.util.concurrent.ExecutionException;

/**
 * Interface for Resume service operations.
 * Implemented by DevResumeService (in-memory) and ProductionResumeService (Firestore).
 */
public interface ResumeService {
    
    List<Resume> getAllResumes(String userId) throws ExecutionException, InterruptedException;
    
    Resume createResume(Resume resume, String userId) throws ExecutionException, InterruptedException;
    
    Resume getResumeById(String id, String userId) throws ExecutionException, InterruptedException;
    
    Resume updateResume(String id, Resume resume, String userId) throws ExecutionException, InterruptedException;
    
    void deleteResume(String id, String userId) throws ExecutionException, InterruptedException;
}
