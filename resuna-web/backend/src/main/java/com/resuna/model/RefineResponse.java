package com.resuna.model;

import java.util.List;

public class RefineResponse {
    private List<Refinement> refinements;
    private int creditsUsed;

    public RefineResponse() {}

    public RefineResponse(List<Refinement> refinements, int creditsUsed) {
        this.refinements = refinements;
        this.creditsUsed = creditsUsed;
    }

    public List<Refinement> getRefinements() { return refinements; }
    public void setRefinements(List<Refinement> refinements) { this.refinements = refinements; }

    public int getCreditsUsed() { return creditsUsed; }
    public void setCreditsUsed(int creditsUsed) { this.creditsUsed = creditsUsed; }

    public static class Refinement {
        private String original;
        private String refined;
        private String explanation;
        private List<String> improvements;

        public Refinement() {}

        public String getOriginal() { return original; }
        public void setOriginal(String original) { this.original = original; }

        public String getRefined() { return refined; }
        public void setRefined(String refined) { this.refined = refined; }

        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }

        public List<String> getImprovements() { return improvements; }
        public void setImprovements(List<String> improvements) { this.improvements = improvements; }
    }
}
