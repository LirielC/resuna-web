package com.resuna.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.resuna.model.Resume;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Repository
@Profile("!dev")
public class ResumeRepository {

    private static final String COLLECTION_NAME = "resumes";
    private final Firestore firestore;

    public ResumeRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public List<Resume> findAllByUserId(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("userId", userId)
                .orderBy("updatedAt", Query.Direction.DESCENDING)
                .get();

        List<Resume> resumes = new ArrayList<>();
        for (DocumentSnapshot doc : future.get().getDocuments()) {
            resumes.add(documentToResume(doc));
        }
        return resumes;
    }

    public Optional<Resume> findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(COLLECTION_NAME).document(id).get().get();
        if (doc.exists()) {
            return Optional.of(documentToResume(doc));
        }
        return Optional.empty();
    }

    public Resume save(Resume resume) throws ExecutionException, InterruptedException {
        if (resume.getId() == null || resume.getId().isEmpty()) {
            resume.setId(UUID.randomUUID().toString());
            resume.setCreatedAt(Instant.now());
        }
        resume.setUpdatedAt(Instant.now());

        firestore.collection(COLLECTION_NAME)
                .document(resume.getId())
                .set(resumeToMap(resume))
                .get();

        return resume;
    }

    public void deleteById(String id) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME).document(id).delete().get();
    }

    public void deleteAllByIds(List<String> ids) throws ExecutionException, InterruptedException {
        if (ids == null || ids.isEmpty()) return;
        WriteBatch batch = firestore.batch();
        for (String id : ids) {
            batch.delete(firestore.collection(COLLECTION_NAME).document(id));
        }
        batch.commit().get();
    }

    public boolean existsByIdAndUserId(String id, String userId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(COLLECTION_NAME).document(id).get().get();
        if (doc.exists()) {
            String docUserId = doc.getString("userId");
            return userId.equals(docUserId);
        }
        return false;
    }

    private Resume documentToResume(DocumentSnapshot doc) {
        Resume resume = doc.toObject(Resume.class);
        if (resume != null) {
            resume.setId(doc.getId());
        }
        return resume;
    }

    private Map<String, Object> resumeToMap(Resume resume) {
        Map<String, Object> map = new HashMap<>();
        map.put("userId", resume.getUserId());
        map.put("title", resume.getTitle());
        map.put("language", resume.getLanguage());
        map.put("personalInfo", resume.getPersonalInfo());
        map.put("summary", resume.getSummary());
        map.put("experience", resume.getExperience());
        map.put("projects", resume.getProjects());
        map.put("education", resume.getEducation());
        map.put("skills", resume.getSkills());
        map.put("skillGroups", resume.getSkillGroups());
        map.put("certifications", resume.getCertifications());
        map.put("languages", resume.getLanguages());
        map.put("createdAt", resume.getCreatedAt());
        map.put("updatedAt", resume.getUpdatedAt());
        return map;
    }
}
