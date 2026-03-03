package com.resuna.model;

public class UserStatsDTO {
    private int resumeCount;
    private double avgAtsScore;
    private String memberSince;
    private String planName;

    public UserStatsDTO() {
    }

    public UserStatsDTO(int resumeCount, double avgAtsScore, String memberSince, String planName) {
        this.resumeCount = resumeCount;
        this.avgAtsScore = avgAtsScore;
        this.memberSince = memberSince;
        this.planName = planName;
    }

    public int getResumeCount() {
        return resumeCount;
    }

    public void setResumeCount(int resumeCount) {
        this.resumeCount = resumeCount;
    }

    public double getAvgAtsScore() {
        return avgAtsScore;
    }

    public void setAvgAtsScore(double avgAtsScore) {
        this.avgAtsScore = avgAtsScore;
    }

    public String getMemberSince() {
        return memberSince;
    }

    public void setMemberSince(String memberSince) {
        this.memberSince = memberSince;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }
}
