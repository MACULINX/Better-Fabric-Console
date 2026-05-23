package com.mbucci.betterfabricconsole.web;

public class QuickAction {
    public String id;
    public String name;
    public String command;
    public String color;
    public String icon;

    public QuickAction() {}

    public QuickAction(String id, String name, String command, String color, String icon) {
        this.id = id;
        this.name = name;
        this.command = command;
        this.color = color;
        this.icon = icon;
    }
}
