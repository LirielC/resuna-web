package com.resuna.repository;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Repository
@Profile("!dev")
public class FirestoreDailyResumeQuotaRepository implements DailyResumeQuotaRepository {
    private static final int MAX_RESUMES = 5;
    private static final int MAX_TRANSLATIONS = 4;
    private final Firestore firestore;

    public FirestoreDailyResumeQuotaRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public Limit reserve(String userId, LocalDate day, boolean translated) {
        DocumentReference ref = firestore.collection("daily_resume_quotas").document(userId);
        try {
            return firestore.runTransaction(transaction -> {
                DocumentSnapshot snapshot = transaction.get(ref).get();
                String storedDay = snapshot.getString("day");
                int resumes = day.toString().equals(storedDay) ? value(snapshot, "resumes") : 0;
                int translations = day.toString().equals(storedDay) ? value(snapshot, "translations") : 0;
                if (resumes >= MAX_RESUMES) return Limit.RESUMES;
                if (translated && translations >= MAX_TRANSLATIONS) return Limit.TRANSLATIONS;

                Map<String, Object> next = new HashMap<>();
                next.put("day", day.toString());
                next.put("resumes", resumes + 1);
                next.put("translations", translations + (translated ? 1 : 0));
                transaction.set(ref, next);
                return Limit.NONE;
            }).get();
        } catch (Exception e) {
            throw new IllegalStateException("Could not reserve daily resume quota", e);
        }
    }

    @Override
    public void deleteByUserId(String userId) {
        try {
            firestore.collection("daily_resume_quotas").document(userId).delete().get();
        } catch (Exception e) {
            throw new IllegalStateException("Could not delete daily resume quota", e);
        }
    }

    private static int value(DocumentSnapshot snapshot, String field) {
        Long value = snapshot.getLong(field);
        return value == null ? 0 : Math.toIntExact(value);
    }
}
