package com.mbucci.betterfabricconsole.web;

public class SessionLog {
    public String id;
    public long timestamp;
    public String level;
    public String message;
    public String logger;
    
    // UI enhancement properties
    public Boolean show;
    public Boolean highlight;
    public String highlightColor;

    public SessionLog() {}

    public SessionLog(long timestamp, String level, String message, String logger) {
        this.timestamp = timestamp;
        this.level = level;
        this.message = message;
        this.logger = logger;
    }
}
