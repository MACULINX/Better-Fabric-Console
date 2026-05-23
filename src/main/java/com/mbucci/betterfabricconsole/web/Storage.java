package com.mbucci.betterfabricconsole.web;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Storage {
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private static Path dataDir;
    private static Path configFile;
    private static Path logsFile;

    private static AppConfig config;
    private static List<SessionLog> logs;

    public static synchronized void init() {
        dataDir = FabricLoader.getInstance().getConfigDir().resolve("better_fabric_console");
        configFile = dataDir.resolve("config.json");
        logsFile = dataDir.resolve("session_logs.json");

        try {
            if (!Files.exists(dataDir)) {
                Files.createDirectories(dataDir);
            }

            // Load or create Config
            if (!Files.exists(configFile)) {
                createDefaultConfig();
            } else {
                loadConfig();
            }

            // Load or create Logs
            if (!Files.exists(logsFile)) {
                logs = new ArrayList<>();
                saveLogs();
            } else {
                loadLogs();
            }
        } catch (IOException e) {
            System.err.println("[BetterFabricConsole] Storage initialization failed: " + e.getMessage());
            // Fallbacks
            config = new AppConfig();
            logs = new ArrayList<>();
        }
    }

    private static void createDefaultConfig() {
        config = new AppConfig();
        config.serverName = "Minecraft Server Mod";
        config.hostPort = 8000;
        config.masterPasswordHash = "";
        config.sessionTimeoutMinutes = 1440;
        config.plugins = new PluginState();
        config.plugins.sparkEnabled = true;
        config.plugins.consoleEnabled = true;
        config.plugins.sparkInstalled = false; // detected at runtime
        
        config.filters = new ArrayList<>();
        
        FilterRule rule1 = new FilterRule();
        rule1.id = "1";
        rule1.pattern = "User Authenticator";
        rule1.type = "exclude";
        rule1.active = false;
        config.filters.add(rule1);

        FilterRule rule2 = new FilterRule();
        rule2.id = "2";
        rule2.pattern = "issued server command";
        rule2.type = "highlight";
        rule2.highlightColor = "#00f2fe";
        rule2.active = true;
        config.filters.add(rule2);

        FilterRule rule3 = new FilterRule();
        rule3.id = "3";
        rule3.pattern = "warn|error|fail";
        rule3.type = "highlight";
        rule3.highlightColor = "#f43f5e";
        rule3.active = true;
        config.filters.add(rule3);

        config.quickActions = getDefaultQuickActions();

        saveConfig();
    }

    private static List<QuickAction> getDefaultQuickActions() {
        List<QuickAction> actions = new ArrayList<>();
        actions.add(new QuickAction("1", "Save World", "save-all", "#10b981", "Save"));
        actions.add(new QuickAction("2", "Player List", "list", "#3b82f6", "Users"));
        actions.add(new QuickAction("3", "Set Day", "time set day", "#f59e0b", "Sun"));
        actions.add(new QuickAction("4", "Clear Weather", "weather clear", "#06b6d4", "Cloud"));
        actions.add(new QuickAction("5", "Stop Server", "stop", "#ef4444", "Power"));
        actions.add(new QuickAction("6", "Say Hello", "say Hello from Better Console!", "#8b5cf6", "MessageSquare"));
        return actions;
    }

    public static AppConfig getConfig() {
        if (config == null) init();
        return config;
    }

    public static synchronized void saveConfig() {
        try (Writer writer = Files.newBufferedWriter(configFile)) {
            gson.toJson(config, writer);
        } catch (IOException e) {
            System.err.println("[BetterFabricConsole] Failed to save config: " + e.getMessage());
        }
    }

    private static void loadConfig() {
        try (Reader reader = Files.newBufferedReader(configFile)) {
            config = gson.fromJson(reader, AppConfig.class);
            if (config != null) {
                boolean dirty = false;
                if (config.quickActions == null) {
                    config.quickActions = getDefaultQuickActions();
                    dirty = true;
                }
                if (config.masterPasswordHash == null) {
                    config.masterPasswordHash = "";
                    dirty = true;
                }
                if (config.sessionTimeoutMinutes <= 0) {
                    config.sessionTimeoutMinutes = 1440;
                    dirty = true;
                }
                if (dirty) {
                    saveConfig();
                }
            }
        } catch (Exception e) {
            System.err.println("[BetterFabricConsole] Failed to load config, generating defaults: " + e.getMessage());
            createDefaultConfig();
        }
    }

    public static List<SessionLog> getLogs() {
        if (logs == null) init();
        return logs;
    }

    public static synchronized void saveLogs() {
        try (Writer writer = Files.newBufferedWriter(logsFile)) {
            gson.toJson(logs, writer);
        } catch (IOException e) {
            System.err.println("[BetterFabricConsole] Failed to save logs: " + e.getMessage());
        }
    }

    private static void loadLogs() {
        try (Reader reader = Files.newBufferedReader(logsFile)) {
            Type listType = new TypeToken<ArrayList<SessionLog>>(){}.getType();
            logs = gson.fromJson(reader, listType);
            if (logs == null) {
                logs = new ArrayList<>();
            }
        } catch (Exception e) {
            System.err.println("[BetterFabricConsole] Failed to load logs: " + e.getMessage());
            logs = new ArrayList<>();
        }
    }

    public static synchronized SessionLog appendLog(SessionLog log) {
        if (logs == null) init();
        log.id = UUID.randomUUID().toString();
        logs.add(log);
        if (logs.size() > 500) {
            logs.remove(0);
        }
        saveLogs();
        return log;
    }
}
