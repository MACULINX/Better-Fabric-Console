package com.mbucci.betterfabricconsole.web;

public class FilterRule {
    public String id;
    public String pattern;
    public String type; // "include" | "exclude" | "highlight"
    public String highlightColor;
    public boolean active;
}
