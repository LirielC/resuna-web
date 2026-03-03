package com.resuna.model;

public class FeatureFlags {
    private String userId;
    private boolean aiEnabled;
    private boolean atsEnabled;

    public FeatureFlags() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public boolean isAiEnabled() { return aiEnabled; }
    public void setAiEnabled(boolean aiEnabled) { this.aiEnabled = aiEnabled; }

    public boolean isAtsEnabled() { return atsEnabled; }
    public void setAtsEnabled(boolean atsEnabled) { this.atsEnabled = atsEnabled; }
}
