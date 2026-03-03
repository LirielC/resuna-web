package com.resuna.model;

import java.util.Date;

public class UserSubscription {
    private String userId;
    private SubscriptionStatus status;
    private SubscriptionTier tier;
    private int creditsRemaining;
    private int creditsUsed;
    private int dailyLimit;
    private Date resetTime;
    private Date subscriptionStart;
    private Date subscriptionEnd;
    private Date trialEndsAt;

    public UserSubscription() {}

    public enum SubscriptionStatus {
        TRIAL, ACTIVE, PAST_DUE, CANCELED, FREE
    }

    public enum SubscriptionTier {
        FREE, PREMIUM_MONTHLY, PREMIUM_YEARLY
    }

    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public SubscriptionStatus getStatus() { return status; }
    public void setStatus(SubscriptionStatus status) { this.status = status; }

    public SubscriptionTier getTier() { return tier; }
    public void setTier(SubscriptionTier tier) { this.tier = tier; }

    public int getCreditsRemaining() { return creditsRemaining; }
    public void setCreditsRemaining(int creditsRemaining) { this.creditsRemaining = creditsRemaining; }

    public int getCreditsUsed() { return creditsUsed; }
    public void setCreditsUsed(int creditsUsed) { this.creditsUsed = creditsUsed; }

    public int getDailyLimit() { return dailyLimit; }
    public void setDailyLimit(int dailyLimit) { this.dailyLimit = dailyLimit; }

    public Date getResetTime() { return resetTime; }
    public void setResetTime(Date resetTime) { this.resetTime = resetTime; }

    public Date getSubscriptionStart() { return subscriptionStart; }
    public void setSubscriptionStart(Date subscriptionStart) { this.subscriptionStart = subscriptionStart; }

    public Date getSubscriptionEnd() { return subscriptionEnd; }
    public void setSubscriptionEnd(Date subscriptionEnd) { this.subscriptionEnd = subscriptionEnd; }

    public Date getTrialEndsAt() { return trialEndsAt; }
    public void setTrialEndsAt(Date trialEndsAt) { this.trialEndsAt = trialEndsAt; }

    public boolean hasPremiumAccess() {
        return creditsRemaining > 0;
    }

    public boolean canUseAIFeatures() {
        return hasPremiumAccess();
    }

    public boolean consumeCredits(int amount) {
        if (creditsRemaining >= amount) {
            creditsRemaining -= amount;
            creditsUsed += amount;
            return true;
        }
        return false;
    }
}
