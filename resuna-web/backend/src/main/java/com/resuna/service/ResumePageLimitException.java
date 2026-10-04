package com.resuna.service;

public class ResumePageLimitException extends RuntimeException {
    public ResumePageLimitException() {
        super("O currículo ultrapassa o limite de 2 páginas.");
    }
}
