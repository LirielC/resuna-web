package com.resuna.model;

import java.time.Instant;

public class InitialCreditsCounter {
    private String key;
    private String type;
    private String day;
    private int count;
    private Instant updatedAt;
    private Instant expireAt;
    private Boolean granted;

    public InitialCreditsCounter() {}

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Instant getExpireAt() { return expireAt; }
    public void setExpireAt(Instant expireAt) { this.expireAt = expireAt; }

    public Boolean getGranted() { return granted; }
    public void setGranted(Boolean granted) { this.granted = granted; }
}
