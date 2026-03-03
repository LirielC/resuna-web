package com.resuna.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class PurchaseCreditsRequest {
    @NotNull
    @Positive
    private Integer credits;

    private Boolean paymentVerified;
    private String paymentReference;

    public PurchaseCreditsRequest() {}

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public Boolean getPaymentVerified() { return paymentVerified; }
    public void setPaymentVerified(Boolean paymentVerified) { this.paymentVerified = paymentVerified; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
}
