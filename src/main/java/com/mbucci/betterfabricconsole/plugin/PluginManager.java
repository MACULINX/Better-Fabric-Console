package com.mbucci.betterfabricconsole.plugin;

import com.mbucci.betterfabricconsole.console.ConsoleBridge;
import com.mbucci.betterfabricconsole.web.WebServer;

public class PluginManager {
    private static boolean sparkEnabled = true;
    private static boolean consoleEnabled = true;

    private static boolean sparkInstalled = false;

    public static void init() {
        // Capability detection: Check if Spark class is loaded
        try {
            Class.forName("me.lucko.spark.api.SparkProvider");
            sparkInstalled = true;
            System.out.println("[BetterFabricConsole] Spark API detected in classpath.");
        } catch (ClassNotFoundException e) {
            sparkInstalled = false;
            sparkEnabled = false;
            System.out.println("[BetterFabricConsole] Spark API not found. Disabling Spark bridge.");
        }
    }

    public static boolean isSparkAvailable() {
        return sparkInstalled && sparkEnabled;
    }

    public static boolean isConsoleAvailable() {
        return consoleEnabled;
    }

    public static boolean isSparkInstalled() {
        return sparkInstalled;
    }

    private static void invokeSparkBridge(String methodName) {
        try {
            Class<?> clazz = Class.forName("com.mbucci.betterfabricconsole.spark.SparkBridge");
            clazz.getMethod(methodName).invoke(null);
        } catch (Exception e) {
            System.err.println("[BetterFabricConsole] Error invoking SparkBridge." + methodName + ": " + e.getMessage());
        }
    }

    public static void startSpark() {
        if (isSparkAvailable()) {
            invokeSparkBridge("start");
        }
    }

    public static void stopSpark() {
        if (sparkInstalled) {
            invokeSparkBridge("stop");
        }
    }

    public static void toggleSpark(boolean enabled) {
        if (!sparkInstalled) return;
        if (sparkEnabled != enabled) {
            sparkEnabled = enabled;
            System.out.println("[BetterFabricConsole] Spark plugin status toggled: " + (enabled ? "ENABLED" : "DISABLED"));
            if (enabled) {
                startSpark();
            } else {
                stopSpark();
            }
            sendCapabilitiesUpdate();
        }
    }

    public static void toggleConsole(boolean enabled) {
        if (consoleEnabled != enabled) {
            consoleEnabled = enabled;
            System.out.println("[BetterFabricConsole] Console plugin status toggled: " + (enabled ? "ENABLED" : "DISABLED"));
            if (enabled) {
                ConsoleBridge.start();
            } else {
                ConsoleBridge.stop();
            }
            sendCapabilitiesUpdate();
        }
    }

    /**
     * Broadcasts capability updates to the web service backend.
     */
    public static void sendCapabilitiesUpdate() {
        WebServer.broadcastCapabilities();
    }
}
