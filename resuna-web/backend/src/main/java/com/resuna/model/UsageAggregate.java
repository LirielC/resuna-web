package com.resuna.model;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

public class UsageAggregate {
    private String id;
    private String periodType;
    private String periodKey;
    private String userId;
    private Map<String, Long> actionCounts = new HashMap<>();
    private long totalRequests;
    private Instant updatedAt;

    public UsageAggregate() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPeriodType() { return periodType; }
    public void setPeriodType(String periodType) { this.periodType = periodType; }

    public String getPeriodKey() { return periodKey; }
    public void setPeriodKey(String periodKey) { this.periodKey = periodKey; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Map<String, Long> getActionCounts() { return actionCounts; }
    public void setActionCounts(Map<String, Long> actionCounts) { this.actionCounts = actionCounts; }

    public long getTotalRequests() { return totalRequests; }
    public void setTotalRequests(long totalRequests) { this.totalRequests = totalRequests; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
