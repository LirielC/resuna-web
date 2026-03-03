package com.resuna.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.resuna.model.UserActivity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsService.class);
    private static final String COLLECTION_NAME = "user_activities";

    /** One-way hash of an IP address for abuse-detection correlation without storing raw PII. */
    static String hashIp(String ip) {
        if (ip == null || ip.isBlank()) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(ip.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(16);
            for (int i = 0; i < 8; i++) {           // first 8 bytes → 16 hex chars is enough
                hex.append(String.format("%02x", hash[i]));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            return null; // SHA-256 is always available; unreachable
        }
    }

    private final UsageAggregateService usageAggregateService;

    public AnalyticsService(UsageAggregateService usageAggregateService) {
        this.usageAggregateService = usageAggregateService;
    }

    private Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }

    /**
     * Log a user activity asynchronously.
     */
    @Async
    public void logActivity(String userId, String userEmail, String action, String details,
            String ipAddress, String userAgent) {
        try {
            UserActivity activity = new UserActivity(userId, userEmail, action, details);
            activity.setIpAddress(hashIp(ipAddress));   // store hash, never raw IP
            activity.setUserAgent(userAgent);            // setUserAgent extracts browser/OS family

            getFirestore().collection(COLLECTION_NAME).add(activity.toMap());
            usageAggregateService.increment(action);
            usageAggregateService.incrementForUser(userId, action);
            logger.debug("Logged activity: {} - {} - {}", userId, action, details);
        } catch (Exception e) {
            logger.error("Failed to log activity: {}", e.getMessage());
        }
    }

    /**
     * Log a simple activity.
     */
    @Async
    public void logActivity(String userId, String userEmail, String action) {
        logActivity(userId, userEmail, action, null, null, null);
    }

    /**
     * Get dashboard statistics.
     */
    public Map<String, Object> getDashboardStats() throws ExecutionException, InterruptedException {
        Map<String, Object> stats = new HashMap<>();

        Instant now = Instant.now();
        long todayStart = now.truncatedTo(ChronoUnit.DAYS).toEpochMilli();
        long weekStart = now.minus(7, ChronoUnit.DAYS).toEpochMilli();
        long monthStart = now.minus(30, ChronoUnit.DAYS).toEpochMilli();

        CollectionReference collection = getFirestore().collection(COLLECTION_NAME);

        // Get all activities from last 30 days for analysis
        ApiFuture<QuerySnapshot> monthQuery = collection
                .whereGreaterThanOrEqualTo("timestamp", monthStart)
                .get();

        QuerySnapshot monthSnapshot = monthQuery.get();
        List<QueryDocumentSnapshot> monthDocs = monthSnapshot.getDocuments();

        // Count unique users
        Set<String> allUsers = new HashSet<>();
        Set<String> todayUsers = new HashSet<>();
        Set<String> weekUsers = new HashSet<>();
        Set<String> monthUsers = new HashSet<>();
        Map<String, Long> actionBreakdown = new HashMap<>();
        long activitiesToday = 0;

        for (QueryDocumentSnapshot doc : monthDocs) {
            String userId = doc.getString("userId");
            Long timestamp = doc.getLong("timestamp");
            String action = doc.getString("action");

            if (userId != null) {
                allUsers.add(userId);
                monthUsers.add(userId);

                if (timestamp != null) {
                    if (timestamp >= weekStart) {
                        weekUsers.add(userId);
                    }
                    if (timestamp >= todayStart) {
                        todayUsers.add(userId);
                        activitiesToday++;
                    }
                }
            }

            if (action != null) {
                actionBreakdown.merge(action, 1L, Long::sum);
            }
        }

        // Get total unique users (all time)
        ApiFuture<QuerySnapshot> allQuery = collection.get();
        Set<String> allTimeUsers = new HashSet<>();
        for (QueryDocumentSnapshot doc : allQuery.get().getDocuments()) {
            String userId = doc.getString("userId");
            if (userId != null)
                allTimeUsers.add(userId);
        }

        stats.put("totalUsers", allTimeUsers.size());
        stats.put("activeToday", todayUsers.size());
        stats.put("activeWeek", weekUsers.size());
        stats.put("activeMonth", monthUsers.size());
        stats.put("activitiesToday", activitiesToday);
        stats.put("actionBreakdown", actionBreakdown);

        return stats;
    }

    /**
     * Get recent activities with pagination.
     */
    public Map<String, Object> getRecentActivities(int page, int size) throws ExecutionException, InterruptedException {
        Map<String, Object> result = new HashMap<>();

        CollectionReference collection = getFirestore().collection(COLLECTION_NAME);

        // Get total count
        ApiFuture<QuerySnapshot> countQuery = collection.get();
        int totalElements = countQuery.get().size();

        // Get paginated results
        ApiFuture<QuerySnapshot> query = collection
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .offset(page * size)
                .limit(size)
                .get();

        List<Map<String, Object>> activities = new ArrayList<>();
        for (QueryDocumentSnapshot doc : query.get().getDocuments()) {
            Map<String, Object> activity = new HashMap<>(doc.getData());
            activity.put("id", doc.getId());

            // Convert timestamp to ISO string for frontend
            Long ts = doc.getLong("timestamp");
            if (ts != null) {
                activity.put("timestamp", Instant.ofEpochMilli(ts).toString());
            }

            activities.add(activity);
        }

        result.put("content", activities);
        result.put("totalElements", totalElements);
        result.put("totalPages", (int) Math.ceil((double) totalElements / size));
        result.put("number", page);
        result.put("size", size);

        return result;
    }

    /**
     * Get all users with their last activity.
     */
    public List<Map<String, Object>> getAllUsersWithLastActivity() throws ExecutionException, InterruptedException {
        CollectionReference collection = getFirestore().collection(COLLECTION_NAME);

        ApiFuture<QuerySnapshot> query = collection
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();

        Map<String, Map<String, Object>> userMap = new LinkedHashMap<>();

        for (QueryDocumentSnapshot doc : query.get().getDocuments()) {
            String docUserId = doc.getString("userId");
            if (docUserId != null && !userMap.containsKey(docUserId)) {
                Map<String, Object> user = new HashMap<>();
                user.put("userId", docUserId);
                user.put("email", doc.getString("userEmail"));

                Long ts = doc.getLong("timestamp");
                user.put("lastActivity", ts != null ? Instant.ofEpochMilli(ts).toString() : null);

                userMap.put(docUserId, user);
            }
        }

        return new ArrayList<>(userMap.values());
    }

    /**
     * Get activities for a specific user.
     */
    public Map<String, Object> getUserActivities(String userId, int page, int size)
            throws ExecutionException, InterruptedException {
        Map<String, Object> result = new HashMap<>();

        CollectionReference collection = getFirestore().collection(COLLECTION_NAME);

        ApiFuture<QuerySnapshot> query = collection
                .whereEqualTo("userId", userId)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .offset(page * size)
                .limit(size)
                .get();

        List<Map<String, Object>> activities = new ArrayList<>();
        for (QueryDocumentSnapshot doc : query.get().getDocuments()) {
            Map<String, Object> activity = new HashMap<>(doc.getData());
            activity.put("id", doc.getId());

            Long ts = doc.getLong("timestamp");
            if (ts != null) {
                activity.put("timestamp", Instant.ofEpochMilli(ts).toString());
            }

            activities.add(activity);
        }

        result.put("content", activities);
        result.put("number", page);
        result.put("size", size);

        return result;
    }

    /**
     * Aggregate user usage summary (requests count, last activity, email).
     */
    public List<Map<String, Object>> getUserUsageSummary(int days)
            throws ExecutionException, InterruptedException {
        CollectionReference collection = getFirestore().collection(COLLECTION_NAME);
        Instant now = Instant.now();
        long since = now.minus(days, ChronoUnit.DAYS).toEpochMilli();

        ApiFuture<QuerySnapshot> query = collection
                .whereGreaterThanOrEqualTo("timestamp", since)
                .get();

        Map<String, Map<String, Object>> usageMap = new LinkedHashMap<>();
        for (QueryDocumentSnapshot doc : query.get().getDocuments()) {
            String userId = doc.getString("userId");
            if (userId == null) {
                continue;
            }
            Map<String, Object> entry = usageMap.computeIfAbsent(userId, id -> {
                Map<String, Object> map = new HashMap<>();
                map.put("userId", id);
                map.put("email", doc.getString("userEmail"));
                map.put("totalRequests", 0L);
                map.put("lastActivity", null);
                return map;
            });

            Long count = (Long) entry.get("totalRequests");
            entry.put("totalRequests", count == null ? 1L : count + 1L);

            Long ts = doc.getLong("timestamp");
            if (ts != null) {
                Instant last = (Instant) entry.get("lastActivity");
                Instant current = Instant.ofEpochMilli(ts);
                if (last == null || current.isAfter(last)) {
                    entry.put("lastActivity", current);
                }
            }
        }

        for (Map<String, Object> entry : usageMap.values()) {
            Instant last = (Instant) entry.get("lastActivity");
            if (last != null) {
                entry.put("lastActivity", last.toString());
            }
        }

        return new ArrayList<>(usageMap.values());
    }
}
