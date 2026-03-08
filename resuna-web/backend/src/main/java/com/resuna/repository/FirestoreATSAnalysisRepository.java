package com.resuna.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.resuna.exception.ResourceNotFoundException;
import com.resuna.model.ATSAnalysisResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

/**
 * Firestore implementation of ATSAnalysisRepository for production.
 */
@Repository
@Profile("!dev")
public class FirestoreATSAnalysisRepository implements ATSAnalysisRepository {
    
    private static final Logger logger = LoggerFactory.getLogger(FirestoreATSAnalysisRepository.class);
    private static final String COLLECTION_USERS = "users";
    private static final String COLLECTION_ANALYSES = "ats_analyses";
    
    private final Firestore firestore;
    
    public FirestoreATSAnalysisRepository(Firestore firestore) {
        this.firestore = firestore;
    }
    
    @Override
    public ATSAnalysisResult save(ATSAnalysisResult analysis) {
        try {
            if (analysis.getId() == null) {
                analysis.setId(UUID.randomUUID().toString());
            }
            
            if (analysis.getCreatedAt() == null) {
                analysis.setCreatedAt(Instant.now());
            }
            
            DocumentReference docRef = getUserAnalysisRef(analysis.getUserId(), analysis.getId());
            
            ApiFuture<WriteResult> result = docRef.set(analysis);
            result.get();
            
            logger.debug("ATS Analysis saved to Firestore: {}", analysis.getId());
            return analysis;
            
        } catch (Exception e) {
            logger.error("Error saving ATS analysis to Firestore", e);
            throw new RuntimeException("Failed to save analysis", e);
        }
    }
    
    @Override
    public Optional<ATSAnalysisResult> findById(String id) {
        // Note: This requires knowing the userId. In production, you might want to add a top-level collection
        // For now, we'll return empty if not found via other methods
        logger.warn("findById without userId not supported in Firestore implementation");
        return Optional.empty();
    }
    
    @Override
    public List<ATSAnalysisResult> findByResumeId(String resumeId, String userId) {
        try {
            CollectionReference analysesRef = getUserAnalysesCollection(userId);
            
            ApiFuture<QuerySnapshot> query = analysesRef
                    .whereEqualTo("resumeId", resumeId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .get();
            
            QuerySnapshot querySnapshot = query.get();
            List<ATSAnalysisResult> analyses = new ArrayList<>();
            
            for (DocumentSnapshot document : querySnapshot.getDocuments()) {
                ATSAnalysisResult analysis = document.toObject(ATSAnalysisResult.class);
                if (analysis != null) {
                    analyses.add(analysis);
                }
            }
            
            logger.debug("Found {} analyses for resume {}", analyses.size(), resumeId);
            return analyses;
            
        } catch (Exception e) {
            logger.error("Error finding analyses by resume ID", e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public List<ATSAnalysisResult> findByUserId(String userId) {
        try {
            CollectionReference analysesRef = getUserAnalysesCollection(userId);
            
            ApiFuture<QuerySnapshot> query = analysesRef
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .get();
            
            QuerySnapshot querySnapshot = query.get();
            List<ATSAnalysisResult> analyses = new ArrayList<>();
            
            for (DocumentSnapshot document : querySnapshot.getDocuments()) {
                ATSAnalysisResult analysis = document.toObject(ATSAnalysisResult.class);
                if (analysis != null) {
                    analyses.add(analysis);
                }
            }
            
            logger.debug("Found {} analyses for user {}", analyses.size(), userId);
            return analyses;
            
        } catch (Exception e) {
            logger.error("Error finding analyses by user ID", e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public Optional<ATSAnalysisResult> findLatestByResumeId(String resumeId, String userId) {
        try {
            CollectionReference analysesRef = getUserAnalysesCollection(userId);
            
            ApiFuture<QuerySnapshot> query = analysesRef
                    .whereEqualTo("resumeId", resumeId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(1)
                    .get();
            
            QuerySnapshot querySnapshot = query.get();
            
            if (!querySnapshot.isEmpty()) {
                ATSAnalysisResult analysis = querySnapshot.getDocuments().get(0)
                        .toObject(ATSAnalysisResult.class);
                return Optional.ofNullable(analysis);
            }
            
            return Optional.empty();
            
        } catch (Exception e) {
            logger.error("Error finding latest analysis", e);
            return Optional.empty();
        }
    }
    
    @Override
    public void delete(String id, String userId) {
        try {
            DocumentReference docRef = getUserAnalysisRef(userId, id);
            
            // Check if exists
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            
            if (!document.exists()) {
                throw new ResourceNotFoundException("Analysis not found with id: " + id);
            }
            
            ApiFuture<WriteResult> result = docRef.delete();
            result.get();
            
            logger.debug("ATS Analysis deleted from Firestore: {}", id);
            
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error deleting analysis", e);
            throw new RuntimeException("Failed to delete analysis", e);
        }
    }
    
    public void deleteAllByUserId(String userId) throws ExecutionException, InterruptedException {
        CollectionReference analysesRef = getUserAnalysesCollection(userId);
        List<QueryDocumentSnapshot> docs = analysesRef.get().get().getDocuments();
        if (!docs.isEmpty()) {
            WriteBatch batch = firestore.batch();
            docs.forEach(doc -> batch.delete(doc.getReference()));
            batch.commit().get();
        }
        // Delete the parent user document too
        firestore.collection(COLLECTION_USERS).document(userId).delete().get();
    }

    // Helper methods
    
    private CollectionReference getUserAnalysesCollection(String userId) {
        return firestore
                .collection(COLLECTION_USERS)
                .document(userId)
                .collection(COLLECTION_ANALYSES);
    }
    
    private DocumentReference getUserAnalysisRef(String userId, String analysisId) {
        return getUserAnalysesCollection(userId).document(analysisId);
    }
}
