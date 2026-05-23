package com.mbucci.betterfabricconsole.web;

import io.netty.channel.*;
import io.netty.handler.codec.http.*;
import io.netty.handler.codec.http.websocketx.*;
import io.netty.util.CharsetUtil;
import io.netty.buffer.Unpooled;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import com.mbucci.betterfabricconsole.BetterFabricConsoleMod;
import com.mbucci.betterfabricconsole.plugin.PluginManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

public class WebServerHandler extends SimpleChannelInboundHandler<Object> {
    private static final String WEBSOCKET_PATH = "/ws";
    private WebSocketServerHandshaker handshaker;
    private static final Gson gson = new Gson();

    private boolean authenticated = false;
    private String sessionToken = null;

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {
        if (msg instanceof FullHttpRequest) {
            handleHttpRequest(ctx, (FullHttpRequest) msg);
        } else if (msg instanceof WebSocketFrame) {
            handleWebSocketFrame(ctx, (WebSocketFrame) msg);
        }
    }

    private void handleHttpRequest(ChannelHandlerContext ctx, FullHttpRequest req) throws Exception {
        // Handle CORS preflight options
        if (req.method() == HttpMethod.OPTIONS) {
            FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK);
            setCorsHeaders(response);
            response.headers().set(HttpHeaderNames.CONTENT_LENGTH, 0);
            ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
            return;
        }

        // Handle WebSocket Upgrade
        String uri = req.uri();
        if (uri.startsWith(WEBSOCKET_PATH)) {
            WebSocketServerHandshakerFactory wsFactory = new WebSocketServerHandshakerFactory(
                getWebSocketLocation(req), null, true, 65536);
            handshaker = wsFactory.newHandshaker(req);
            if (handshaker == null) {
                WebSocketServerHandshakerFactory.sendUnsupportedVersionResponse(ctx.channel());
            } else {
                handshaker.handshake(ctx.channel(), req);
                // Do not register client immediately. We wait for authentication frame.
            }
            return;
        }

        // Handle REST APIs
        if (uri.startsWith("/api/")) {
            // Check authorization for all endpoints except setup-status, setup, and auth
            if (!uri.startsWith("/api/setup-status") && !uri.startsWith("/api/setup") && !uri.startsWith("/api/auth")) {
                String authHeader = req.headers().get(HttpHeaderNames.AUTHORIZATION);
                String token = null;
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                }
                if (!AuthManager.validateToken(token)) {
                    sendJsonResponse(ctx, "{\"error\":\"Unauthorized\"}", HttpResponseStatus.UNAUTHORIZED);
                    return;
                }
            }
            handleRestApi(ctx, req);
            return;
        }

        // Handle Static File Serving
        handleStaticFile(ctx, req);
    }

    private void handleWebSocketFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        if (frame instanceof CloseWebSocketFrame) {
            handshaker.close(ctx.channel(), (CloseWebSocketFrame) frame.retain());
            if (authenticated) {
                WebServer.unregisterClient(ctx.channel());
            }
            return;
        }
        if (frame instanceof PingWebSocketFrame) {
            ctx.channel().write(new PongWebSocketFrame(frame.content().retain()));
            return;
        }
        if (frame instanceof TextWebSocketFrame) {
            String text = ((TextWebSocketFrame) frame).text();
            try {
                JsonObject packet = gson.fromJson(text, JsonObject.class);
                
                // Enforce authentication on WebSocket
                if (!authenticated) {
                    if (packet.has("type") && "auth".equals(packet.get("type").getAsString()) && packet.has("token")) {
                        String token = packet.get("token").getAsString();
                        if (AuthManager.validateToken(token)) {
                            authenticated = true;
                            sessionToken = token;
                            WebServer.registerClient(ctx.channel());
                            ctx.channel().writeAndFlush(new TextWebSocketFrame("{\"type\":\"auth_success\"}"));
                        } else {
                            ctx.channel().writeAndFlush(new TextWebSocketFrame("{\"type\":\"auth_failed\",\"error\":\"Invalid token\"}"))
                                .addListener(ChannelFutureListener.CLOSE);
                        }
                    } else {
                        ctx.channel().writeAndFlush(new TextWebSocketFrame("{\"type\":\"auth_failed\",\"error\":\"Authentication required\"}"))
                            .addListener(ChannelFutureListener.CLOSE);
                    }
                    return;
                }

                if (packet.has("type") && "command".equals(packet.get("type").getAsString())) {
                    String cmd = packet.get("command").getAsString();
                    if (cmd != null && !cmd.trim().isEmpty()) {
                        System.out.println("[BetterFabricConsole] Executing console command: " + cmd);
                        BetterFabricConsoleMod.executeCommand(cmd);
                    }
                } else if (packet.has("type") && "ping".equals(packet.get("type").getAsString())) {
                    ctx.channel().writeAndFlush(new TextWebSocketFrame("{\"type\":\"pong\"}"));
                }
            } catch (Exception e) {
                System.err.println("[BetterFabricConsole] Failed parsing WS payload: " + e.getMessage());
            }
        }
    }

    private void handleRestApi(ChannelHandlerContext ctx, FullHttpRequest req) {
        String uri = req.uri();
        HttpMethod method = req.method();

        // 1. GET /api/setup-status
        if (uri.startsWith("/api/setup-status") && method == HttpMethod.GET) {
            JsonObject res = new JsonObject();
            res.addProperty("initialized", AuthManager.isInitialized());
            sendJsonResponse(ctx, gson.toJson(res), HttpResponseStatus.OK);
            return;
        }

        // 2. POST /api/setup
        if (uri.startsWith("/api/setup") && method == HttpMethod.POST) {
            if (AuthManager.isInitialized()) {
                sendJsonResponse(ctx, "{\"error\":\"Already initialized\"}", HttpResponseStatus.BAD_REQUEST);
                return;
            }
            String body = req.content().toString(CharsetUtil.UTF_8);
            try {
                JsonObject bodyJson = gson.fromJson(body, JsonObject.class);
                if (!bodyJson.has("password")) {
                    sendJsonResponse(ctx, "{\"error\":\"Password required\"}", HttpResponseStatus.BAD_REQUEST);
                    return;
                }
                String password = bodyJson.get("password").getAsString();
                if (AuthManager.setup(password)) {
                    sendJsonResponse(ctx, "{\"success\":true}", HttpResponseStatus.OK);
                } else {
                    sendJsonResponse(ctx, "{\"error\":\"Invalid password\"}", HttpResponseStatus.BAD_REQUEST);
                }
            } catch (Exception e) {
                sendJsonResponse(ctx, "{\"error\":\"Invalid request body\"}", HttpResponseStatus.BAD_REQUEST);
            }
            return;
        }

        // 3. POST /api/auth
        if (uri.startsWith("/api/auth") && method == HttpMethod.POST) {
            String body = req.content().toString(CharsetUtil.UTF_8);
            try {
                JsonObject bodyJson = gson.fromJson(body, JsonObject.class);
                if (!bodyJson.has("password")) {
                    sendJsonResponse(ctx, "{\"error\":\"Password required\"}", HttpResponseStatus.BAD_REQUEST);
                    return;
                }
                String password = bodyJson.get("password").getAsString();
                AppConfig config = Storage.getConfig();
                if (AuthManager.verifyPassword(password, config.masterPasswordHash)) {
                    String token = AuthManager.createSession();
                    JsonObject res = new JsonObject();
                    res.addProperty("token", token);
                    sendJsonResponse(ctx, gson.toJson(res), HttpResponseStatus.OK);
                } else {
                    sendJsonResponse(ctx, "{\"error\":\"Invalid password\"}", HttpResponseStatus.UNAUTHORIZED);
                }
            } catch (Exception e) {
                sendJsonResponse(ctx, "{\"error\":\"Invalid request body\"}", HttpResponseStatus.BAD_REQUEST);
            }
            return;
        }

        // 4. GET /api/status
        if (uri.startsWith("/api/status") && method == HttpMethod.GET) {
            sendJsonResponse(ctx, gson.toJson(WebServer.getStatusPayload()), HttpResponseStatus.OK);
            return;
        }

        // 5. GET /api/plugins
        if (uri.startsWith("/api/plugins") && method == HttpMethod.GET) {
            AppConfig config = Storage.getConfig();
            JsonObject payload = new JsonObject();
            payload.add("plugins", gson.toJsonTree(config.plugins));
            
            JsonObject cap = new JsonObject();
            cap.addProperty("sparkInstalled", PluginManager.isSparkInstalled());
            cap.addProperty("sparkEnabled", PluginManager.isSparkAvailable());
            cap.addProperty("consoleAvailable", PluginManager.isConsoleAvailable());
            payload.add("capabilities", cap);

            sendJsonResponse(ctx, gson.toJson(payload), HttpResponseStatus.OK);
            return;
        }

        // 6. POST /api/plugins/toggle
        if (uri.startsWith("/api/plugins/toggle") && method == HttpMethod.POST) {
            String body = req.content().toString(CharsetUtil.UTF_8);
            try {
                JsonObject bodyJson = gson.fromJson(body, JsonObject.class);
                String plugin = bodyJson.get("plugin").getAsString();
                boolean enabled = bodyJson.get("enabled").getAsBoolean();

                AppConfig config = Storage.getConfig();
                if ("spark".equals(plugin)) {
                    config.plugins.sparkEnabled = enabled;
                    PluginManager.toggleSpark(enabled);
                } else if ("console".equals(plugin)) {
                    config.plugins.consoleEnabled = enabled;
                    PluginManager.toggleConsole(enabled);
                } else {
                    sendJsonResponse(ctx, "{\"error\":\"Invalid plugin\"}", HttpResponseStatus.BAD_REQUEST);
                    return;
                }
                Storage.saveConfig();

                JsonObject response = new JsonObject();
                response.addProperty("success", true);
                response.add("plugins", gson.toJsonTree(config.plugins));
                
                sendJsonResponse(ctx, gson.toJson(response), HttpResponseStatus.OK);
            } catch (Exception e) {
                sendJsonResponse(ctx, "{\"error\":\"Invalid JSON body\"}", HttpResponseStatus.BAD_REQUEST);
            }
            return;
        }

        // 7. GET /api/filters
        if (uri.startsWith("/api/filters") && method == HttpMethod.GET) {
            AppConfig config = Storage.getConfig();
            sendJsonResponse(ctx, gson.toJson(config.filters), HttpResponseStatus.OK);
            return;
        }

        // 8. POST /api/filters
        if (uri.startsWith("/api/filters") && method == HttpMethod.POST) {
            String body = req.content().toString(CharsetUtil.UTF_8);
            try {
                Type listType = new TypeToken<ArrayList<FilterRule>>(){}.getType();
                List<FilterRule> rules = gson.fromJson(body, listType);
                if (rules == null) {
                    sendJsonResponse(ctx, "{\"error\":\"Invalid body\"}", HttpResponseStatus.BAD_REQUEST);
                    return;
                }

                AppConfig config = Storage.getConfig();
                config.filters = rules;
                Storage.saveConfig();

                // Broadcast new filters to WS clients
                JsonObject updatePacket = new JsonObject();
                updatePacket.addProperty("type", "filter_update");
                updatePacket.add("filters", gson.toJsonTree(config.filters));
                WebServer.broadcast(gson.toJson(updatePacket));

                JsonObject response = new JsonObject();
                response.addProperty("success", true);
                response.add("filters", gson.toJsonTree(config.filters));
                sendJsonResponse(ctx, gson.toJson(response), HttpResponseStatus.OK);
            } catch (Exception e) {
                sendJsonResponse(ctx, "{\"error\":\"Invalid JSON rules array\"}", HttpResponseStatus.BAD_REQUEST);
            }
            return;
        }

        // 9. GET /api/session
        if (uri.startsWith("/api/session") && method == HttpMethod.GET) {
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
            sendJsonResponse(ctx, gson.toJson(filteredLogs), HttpResponseStatus.OK);
            return;
        }

        // 10. GET /api/config
        if (uri.startsWith("/api/config") && method == HttpMethod.GET) {
            sendJsonResponse(ctx, gson.toJson(Storage.getConfig()), HttpResponseStatus.OK);
            return;
        }

        // 11. POST /api/config
        if (uri.startsWith("/api/config") && method == HttpMethod.POST) {
            String body = req.content().toString(CharsetUtil.UTF_8);
            try {
                JsonObject bodyJson = gson.fromJson(body, JsonObject.class);
                AppConfig config = Storage.getConfig();
                boolean changed = false;
                if (bodyJson.has("serverName")) {
                    config.serverName = bodyJson.get("serverName").getAsString();
                    changed = true;
                }
                if (bodyJson.has("sessionTimeoutMinutes")) {
                    config.sessionTimeoutMinutes = bodyJson.get("sessionTimeoutMinutes").getAsInt();
                    changed = true;
                }
                if (changed) {
                    Storage.saveConfig();
                    // Broadcast update to WS clients
                    WebServer.broadcast(gson.toJson(WebServer.getStatusPayload()));
                }

                JsonObject response = new JsonObject();
                response.addProperty("success", true);
                response.add("config", gson.toJsonTree(config));
                sendJsonResponse(ctx, gson.toJson(response), HttpResponseStatus.OK);
            } catch (Exception e) {
                sendJsonResponse(ctx, "{\"error\":\"Invalid request body\"}", HttpResponseStatus.BAD_REQUEST);
            }
            return;
        }

        // 12. GET /api/quick-actions
        if (uri.startsWith("/api/quick-actions") && method == HttpMethod.GET) {
            sendJsonResponse(ctx, gson.toJson(Storage.getConfig().quickActions), HttpResponseStatus.OK);
            return;
        }

        // 13. POST /api/quick-actions
        if (uri.startsWith("/api/quick-actions") && method == HttpMethod.POST) {
            String body = req.content().toString(CharsetUtil.UTF_8);
            try {
                QuickAction action = gson.fromJson(body, QuickAction.class);
                if (action.name == null || action.name.trim().isEmpty() || action.command == null || action.command.trim().isEmpty()) {
                    sendJsonResponse(ctx, "{\"error\":\"Name and command are required\"}", HttpResponseStatus.BAD_REQUEST);
                    return;
                }
                AppConfig config = Storage.getConfig();
                if (action.id == null || action.id.trim().isEmpty()) {
                    action.id = java.util.UUID.randomUUID().toString();
                    config.quickActions.add(action);
                } else {
                    int index = -1;
                    for (int i = 0; i < config.quickActions.size(); i++) {
                        if (config.quickActions.get(i).id.equals(action.id)) {
                            index = i;
                            break;
                        }
                    }
                    if (index != -1) {
                        int idInt = 0;
                        try { idInt = Integer.parseInt(action.id); } catch(Exception ignored){}
                        if (idInt >= 1 && idInt <= 6) {
                            sendJsonResponse(ctx, "{\"error\":\"Cannot modify default quick actions\"}", HttpResponseStatus.BAD_REQUEST);
                            return;
                        }
                        config.quickActions.set(index, action);
                    } else {
                        config.quickActions.add(action);
                    }
                }
                Storage.saveConfig();
                sendJsonResponse(ctx, gson.toJson(action), HttpResponseStatus.OK);
            } catch (Exception e) {
                sendJsonResponse(ctx, "{\"error\":\"Invalid request body\"}", HttpResponseStatus.BAD_REQUEST);
            }
            return;
        }

        // 14. DELETE /api/quick-actions/{id}
        if (uri.startsWith("/api/quick-actions/") && method == HttpMethod.DELETE) {
            String id = uri.substring("/api/quick-actions/".length());
            int idInt = 0;
            try { idInt = Integer.parseInt(id); } catch(Exception ignored){}
            if (idInt >= 1 && idInt <= 6) {
                sendJsonResponse(ctx, "{\"error\":\"Cannot delete default quick actions\"}", HttpResponseStatus.BAD_REQUEST);
                return;
            }
            AppConfig config = Storage.getConfig();
            boolean removed = config.quickActions.removeIf(a -> a.id.equals(id));
            if (removed) {
                Storage.saveConfig();
                sendJsonResponse(ctx, "{\"success\":true}", HttpResponseStatus.OK);
            } else {
                sendJsonResponse(ctx, "{\"error\":\"Quick action not found\"}", HttpResponseStatus.NOT_FOUND);
            }
            return;
        }

        // API Route not found
        sendJsonResponse(ctx, "{\"error\":\"API Route not found\"}", HttpResponseStatus.NOT_FOUND);
    }

    private void handleStaticFile(ChannelHandlerContext ctx, FullHttpRequest req) {
        String path = req.uri();
        if (path.equals("/")) {
            path = "/index.html";
        }

        // Strip queries
        int qIdx = path.indexOf('?');
        if (qIdx != -1) {
            path = path.substring(0, qIdx);
        }

        // Try load from `/web + path`
        InputStream is = WebServerHandler.class.getResourceAsStream("/web" + path);
        
        // SPA Fallback: if file doesn't exist and doesn't start with `/assets`, serve `/index.html`
        if (is == null) {
            if (!path.startsWith("/assets/")) {
                path = "/index.html";
                is = WebServerHandler.class.getResourceAsStream("/web/index.html");
            }
        }

        if (is == null) {
            // Truly not found
            FullHttpResponse response = new DefaultFullHttpResponse(
                HttpVersion.HTTP_1_1,
                HttpResponseStatus.NOT_FOUND,
                Unpooled.copiedBuffer("404 Not Found", CharsetUtil.UTF_8)
            );
            response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain; charset=UTF-8");
            response.headers().set(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
            ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
            return;
        }

        try {
            byte[] bytes = readAllBytes(is);
            FullHttpResponse response = new DefaultFullHttpResponse(
                HttpVersion.HTTP_1_1,
                HttpResponseStatus.OK,
                Unpooled.copiedBuffer(bytes)
            );
            response.headers().set(HttpHeaderNames.CONTENT_TYPE, getContentType(path));
            response.headers().set(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
            ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
        } catch (IOException e) {
            FullHttpResponse response = new DefaultFullHttpResponse(
                HttpVersion.HTTP_1_1,
                HttpResponseStatus.INTERNAL_SERVER_ERROR,
                Unpooled.copiedBuffer("500 Internal Server Error", CharsetUtil.UTF_8)
            );
            response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain; charset=UTF-8");
            response.headers().set(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
            ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
        } finally {
            try {
                is.close();
            } catch (IOException ignored) {}
        }
    }

    private byte[] readAllBytes(InputStream is) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int nRead;
        byte[] data = new byte[4096];
        while ((nRead = is.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toByteArray();
    }

    private String getContentType(String path) {
        if (path.endsWith(".html")) return "text/html; charset=UTF-8";
        if (path.endsWith(".js")) return "application/javascript; charset=UTF-8";
        if (path.endsWith(".css")) return "text/css; charset=UTF-8";
        if (path.endsWith(".svg")) return "image/svg+xml; charset=UTF-8";
        return "application/octet-stream";
    }

    private void sendJsonResponse(ChannelHandlerContext ctx, String json, HttpResponseStatus status) {
        FullHttpResponse response = new DefaultFullHttpResponse(
            HttpVersion.HTTP_1_1,
            status,
            Unpooled.copiedBuffer(json, CharsetUtil.UTF_8)
        );
        response.headers().set(HttpHeaderNames.CONTENT_TYPE, "application/json; charset=UTF-8");
        response.headers().set(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
        setCorsHeaders(response);
        ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
    }

    private void setCorsHeaders(FullHttpResponse response) {
        response.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
        response.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_METHODS, "GET, POST, DELETE, OPTIONS");
        response.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_HEADERS, "Content-Type, Authorization");
    }

    private String getWebSocketLocation(FullHttpRequest req) {
        String location = req.headers().get(HttpHeaderNames.HOST) + WEBSOCKET_PATH;
        return "ws://" + location;
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        WebServer.unregisterClient(ctx.channel());
        super.channelInactive(ctx);
    }

    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
        WebServer.unregisterClient(ctx.channel());
        super.handlerRemoved(ctx);
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        String msg = cause.getMessage();
        if (msg == null) msg = cause.getClass().getSimpleName();
        System.err.println("[BetterFabricConsole] WebServer connection exception: " + msg);
        ctx.close();
    }
}
