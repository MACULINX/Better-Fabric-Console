package com.mbucci.betterfabricconsole.console;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.core.Appender;
import org.apache.logging.log4j.core.Logger;
import org.apache.logging.log4j.core.appender.AbstractAppender;
import org.apache.logging.log4j.core.config.Property;
import org.apache.logging.log4j.core.LogEvent;
import org.apache.logging.log4j.core.layout.PatternLayout;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.mbucci.betterfabricconsole.plugin.PluginManager;
import com.mbucci.betterfabricconsole.web.Storage;
import com.mbucci.betterfabricconsole.web.SessionLog;
import com.mbucci.betterfabricconsole.web.FilterEngine;
import com.mbucci.betterfabricconsole.web.WebServer;

public class ConsoleBridge {
    private static Appender appender = null;
    private static boolean running = false;
    private static final Gson gson = new Gson();

    public static synchronized void start() {
        if (!PluginManager.isConsoleAvailable() || running) return;

        System.out.println("[BetterFabricConsole] Starting console output interception...");
        Logger rootLogger = (Logger) LogManager.getRootLogger();

        appender = new AbstractAppender("BetterFabricConsoleAppender", null, PatternLayout.createDefaultLayout(), true, Property.EMPTY_ARRAY) {
            @Override
            public void append(LogEvent event) {
                if (!PluginManager.isConsoleAvailable()) return;

                String loggerName = event.getLoggerName();
                String message = event.getMessage().getFormattedMessage();
                
                // CRITICAL FILTER: Skip logs originating from the bridge to prevent infinite feedback loops
                if (loggerName != null && loggerName.startsWith("com.mbucci.betterfabricconsole")) {
                    return;
                }
                if (message != null && message.contains("[BetterFabricConsole]")) {
                    return;
                }

                String level = event.getLevel().name();
                long timestamp = event.getTimeMillis();

                SessionLog log = new SessionLog(timestamp, level, message, loggerName != null ? loggerName : "root");
                SessionLog savedLog = Storage.appendLog(log);

                FilterEngine.FilterResult res = FilterEngine.evaluate(savedLog, Storage.getConfig().filters);
                if (res.show) {
                    JsonObject broadcastPayload = new JsonObject();
                    broadcastPayload.addProperty("type", "log");
                    
                    JsonObject logObj = new JsonObject();
                    logObj.addProperty("id", savedLog.id);
                    logObj.addProperty("timestamp", savedLog.timestamp);
                    logObj.addProperty("level", savedLog.level);
                    logObj.addProperty("message", savedLog.message);
                    logObj.addProperty("logger", savedLog.logger);
                    logObj.addProperty("show", true);
                    logObj.addProperty("highlight", res.highlight);
                    logObj.addProperty("highlightColor", res.color);

                    broadcastPayload.add("log", logObj);

                    WebServer.broadcast(gson.toJson(broadcastPayload));
                }
            }
        };

        appender.start();
        rootLogger.addAppender(appender);
        running = true;
    }

    public static synchronized void stop() {
        if (!running) return;
        System.out.println("[BetterFabricConsole] Detaching log appender...");
        if (appender != null) {
            Logger rootLogger = (Logger) LogManager.getRootLogger();
            rootLogger.removeAppender(appender);
            appender.stop();
            appender = null;
        }
        running = false;
    }
}
