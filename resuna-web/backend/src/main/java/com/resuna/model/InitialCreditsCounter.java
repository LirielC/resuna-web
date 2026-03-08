package com.resuna.model;

import com.google.cloud.Timestamp;

public class InitialCreditsCounter {
    private String key;
    private String type;
    private String day;
    private int count;
    private Timestamp updatedAt;
    private Timestamp expireAt;
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

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public Timestamp getExpireAt() { return expireAt; }
    public void setExpireAt(Timestamp expireAt) { this.expireAt = expireAt; }

    public Boolean getGranted() { return granted; }
    public void setGranted(Boolean granted) { this.granted = granted; }
}
