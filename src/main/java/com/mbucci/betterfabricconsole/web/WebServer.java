package com.mbucci.betterfabricconsole.web;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.stream.ChunkedWriteHandler;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.mbucci.betterfabricconsole.plugin.PluginManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class WebServer {
    private static int port = 8000;
    private static EventLoopGroup bossGroup;
    private static EventLoopGroup workerGroup;
    private static Channel serverChannel;

    private static final Set<Channel> activeClients = ConcurrentHashMap.newKeySet();
    private static final Gson gson = new Gson();

    private static boolean running = false;
    private static JsonObject currentMetrics = null;

    public static synchronized void start() {
        if (running) return;

        // Ensure storage is initialized
        Storage.init();
        
        AppConfig config = Storage.getConfig();
        port = config.hostPort;
        if (port <= 0) port = 8000;

        System.out.println("[BetterFabricConsole] Starting embedded web server on port " + port + "...");

        bossGroup = new NioEventLoopGroup(1);
        workerGroup = new NioEventLoopGroup();

        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
             .channel(NioServerSocketChannel.class)
             .childHandler(new ChannelInitializer<SocketChannel>() {
                 @Override
                 protected void initChannel(SocketChannel ch) {
                     ChannelPipeline pipeline = ch.pipeline();
                     pipeline.addLast(new HttpServerCodec());
                     pipeline.addLast(new HttpObjectAggregator(65536));
                     pipeline.addLast(new ChunkedWriteHandler());
                     pipeline.addLast(new WebServerHandler());
                 }
             });

            serverChannel = b.bind(port).sync().channel();
            running = true;
            System.out.println("[BetterFabricConsole] Embedded web server started successfully on port " + port);
        } catch (Exception e) {
            System.err.println("[BetterFabricConsole] Failed to start embedded web server: " + e.getMessage());
            stop();
        }
    }

    public static synchronized void stop() {
        if (!running) return;
        System.out.println("[BetterFabricConsole] Stopping embedded web server...");

        activeClients.clear();
        currentMetrics = null;

        if (serverChannel != null) {
            serverChannel.close().syncUninterruptibly();
            serverChannel = null;
        }

        if (bossGroup != null) {
            bossGroup.shutdownGracefully();
            bossGroup = null;
        }

        if (workerGroup != null) {
            workerGroup.shutdownGracefully();
            workerGroup = null;
        }

        running = false;
        System.out.println("[BetterFabricConsole] Embedded web server stopped.");
    }

    public static void registerClient(Channel ch) {
        activeClients.add(ch);
        System.out.println("[BetterFabricConsole] Browser WebSocket client connected from: " + ch.remoteAddress());

        // 1. Send status immediately
        ch.writeAndFlush(new TextWebSocketFrame(gson.toJson(getStatusPayload())));

        // 2. Send log history
        ch.writeAndFlush(new TextWebSocketFrame(gson.toJson(getHistoryPayload())));
    }

    public static void unregisterClient(Channel ch) {
        if (activeClients.remove(ch)) {
            System.out.println("[BetterFabricConsole] Browser WebSocket client disconnected: " + ch.remoteAddress());
        }
    }

    public static void broadcast(String message) {
        TextWebSocketFrame frame = new TextWebSocketFrame(message);
        for (Channel ch : activeClients) {
            if (ch.isActive()) {
                ch.writeAndFlush(frame.retain());
            }
        }
        frame.release();
    }

    public static void broadcastCapabilities() {
        JsonObject cap = new JsonObject();
        cap.addProperty("type", "capabilities");
        cap.addProperty("sparkInstalled", PluginManager.isSparkInstalled());
        cap.addProperty("sparkEnabled", PluginManager.isSparkAvailable());
        cap.addProperty("consoleAvailable", PluginManager.isConsoleAvailable());
        
        broadcast(gson.toJson(cap));
    }

    public static synchronized void updateMetrics(double tps10s, double tps1m, double cpuProcess, double cpuSystem, double usedMemory, double maxMemory) {
        JsonObject metrics = new JsonObject();
        metrics.addProperty("tps10s", tps10s);
        metrics.addProperty("tps1m", tps1m);
        metrics.addProperty("cpuProcess", cpuProcess);
        metrics.addProperty("cpuSystem", cpuSystem);
        metrics.addProperty("usedMemory", usedMemory);
        metrics.addProperty("maxMemory", maxMemory);
        metrics.addProperty("timestamp", System.currentTimeMillis());
        currentMetrics = metrics;

        JsonObject packet = new JsonObject();
        packet.addProperty("type", "metrics");
        packet.add("metrics", metrics);
        broadcast(gson.toJson(packet));
    }

    public static JsonObject getStatusPayload() {
        AppConfig config = Storage.getConfig();
        JsonObject payload = new JsonObject();
        payload.addProperty("type", "status");
        payload.addProperty("modConnected", true); // Always true since server is embedded in the mod
        
        JsonObject cap = new JsonObject();
        cap.addProperty("sparkInstalled", PluginManager.isSparkInstalled());
        cap.addProperty("sparkEnabled", PluginManager.isSparkAvailable() && config.plugins.sparkEnabled);
        cap.addProperty("consoleAvailable", PluginManager.isConsoleAvailable() && config.plugins.consoleEnabled);
        payload.add("capabilities", cap);

        // Include last metrics if any (transient)
        payload.add("metrics", currentMetrics); 
        payload.addProperty("serverName", config.serverName);
        return payload;
    }

    private static JsonObject getHistoryPayload() {
        AppConfig config = Storage.getConfig();
        List<SessionLog> rawLogs = Storage.getLogs();
        List<SessionLog> filteredLogs = new ArrayList<>();
        
        for (SessionLog log : rawLogs) {
            FilterEngine.FilterResult res = FilterEngine.evaluate(log, config.filters);
            if (res.show) {
                SessionLog newLog = new SessionLog();
                newLog.id = log.id;
                newLog.timestamp = log.timestamp;
                newLog.level = log.level;
                newLog.message = log.message;
                newLog.logger = log.logger;
                newLog.show = true;
                newLog.highlight = res.highlight;
                newLog.highlightColor = res.color;
                filteredLogs.add(newLog);
            }
        }

        JsonObject payload = new JsonObject();
        payload.addProperty("type", "history");
        payload.add("logs", gson.toJsonTree(filteredLogs));
        return payload;
    }
}
