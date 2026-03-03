package com.resuna.model;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * UserActivity model for Firebase Firestore storage.
 * Collection: "user_activities"
 */
public class UserActivity {

    private String id;
    private String userId;
    private String userEmail;
    private String action; // LOGIN, CREATE_RESUME, UPDATE_RESUME, DELETE_RESUME, ATS_ANALYSIS, EXPORT_PDF,
                           // EXPORT_DOCX
    private String details; // JSON with additional info
    private String ipAddress;
    private String userAgent;
    private Instant timestamp;

    // Empty constructor for Firestore
    public UserActivity() {
        this.timestamp = Instant.now();
    }

    public UserActivity(String userId, String userEmail, String action) {
        this();
        this.userId = userId;
        this.userEmail = userEmail;
        this.action = action;
    }

    public UserActivity(String userId, String userEmail, String action, String details) {
        this(userId, userEmail, action);
        this.details = details;
    }

    /**
     * Convert to Firestore document map.
     * PII minimization: email is not stored (userId is sufficient for analytics);
     * ipAddress must be pre-hashed by the caller; userAgent is already trimmed to browser family.
     */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("userId", userId);
        // userEmail intentionally omitted — userId is sufficient for analytics and admin lookup
        map.put("action", action);
        map.put("details", details);
        map.put("ipAddressHash", ipAddress);   // stored value is already a SHA-256 hash
        map.put("userAgent", userAgent);       // stored value is already trimmed to browser/OS family
        map.put("timestamp", timestamp != null ? timestamp.toEpochMilli() : Instant.now().toEpochMilli());
        return map;
    }

    /**
     * Create from Firestore document.
     */
    public static UserActivity fromMap(String id, Map<String, Object> map) {
        UserActivity activity = new UserActivity();
        activity.setId(id);
        activity.setUserId((String) map.get("userId"));
        activity.setUserEmail((String) map.get("userEmail"));
        activity.setAction((String) map.get("action"));
        activity.setDetails((String) map.get("details"));
        activity.setIpAddress((String) map.get("ipAddress"));
        activity.setUserAgent((String) map.get("userAgent"));

        Object ts = map.get("timestamp");
        if (ts instanceof Long) {
            activity.setTimestamp(Instant.ofEpochMilli((Long) ts));
        } else if (ts instanceof com.google.cloud.Timestamp) {
            activity.setTimestamp(((com.google.cloud.Timestamp) ts).toDate().toInstant());
        }

        return activity;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    /**
     * Stores only the browser family and OS family extracted from the raw User-Agent string.
     * Example: "Chrome/Windows", "Firefox/Linux", "Safari/macOS", "Unknown/Unknown".
     * The full raw UA string is never persisted to reduce fingerprinting risk.
     */
    public void setUserAgent(String userAgent) {
        this.userAgent = extractBrowserFamily(userAgent);
    }

    private static String extractBrowserFamily(String ua) {
        if (ua == null || ua.isBlank()) return "Unknown/Unknown";
        String u = ua.toLowerCase();

        String browser;
        if (u.contains("edg/") || u.contains("edge/"))     browser = "Edge";
        else if (u.contains("opr/") || u.contains("opera")) browser = "Opera";
        else if (u.contains("chrome/"))                      browser = "Chrome";
        else if (u.contains("firefox/"))                     browser = "Firefox";
        else if (u.contains("safari/") && !u.contains("chrome")) browser = "Safari";
        else if (u.contains("curl/"))                        browser = "curl";
        else                                                 browser = "Other";

        String os;
        if (u.contains("windows"))      os = "Windows";
        else if (u.contains("android")) os = "Android";
        else if (u.contains("iphone") || u.contains("ipad")) os = "iOS";
        else if (u.contains("mac os"))  os = "macOS";
        else if (u.contains("linux"))   os = "Linux";
        else                            os = "Other";

        return browser + "/" + os;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
