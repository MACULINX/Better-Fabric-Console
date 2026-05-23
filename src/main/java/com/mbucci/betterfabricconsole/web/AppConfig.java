package com.mbucci.betterfabricconsole.web;

import java.util.List;

public class AppConfig {
    public String serverName;
    public int hostPort;
    public String masterPasswordHash;
    public int sessionTimeoutMinutes;
    public PluginState plugins;
    public List<FilterRule> filters;
    public List<QuickAction> quickActions;
}
