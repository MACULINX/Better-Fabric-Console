package com.mbucci.betterfabricconsole;

import net.fabricmc.api.DedicatedServerModInitializer;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.minecraft.server.MinecraftServer;

import com.mbucci.betterfabricconsole.console.ConsoleBridge;
import com.mbucci.betterfabricconsole.plugin.PluginManager;
import com.mbucci.betterfabricconsole.web.WebServer;

public class BetterFabricConsoleMod implements DedicatedServerModInitializer {
    public static final String MOD_ID = "better_fabric_console";
    private static MinecraftServer serverInstance = null;

    @Override
    public void onInitializeServer() {
        System.out.println("[BetterFabricConsole] Initializing server-side bridge...");

        // Register server lifecycle listeners to obtain Server Instance
        ServerLifecycleEvents.SERVER_STARTING.register(server -> {
            serverInstance = server;
            System.out.println("[BetterFabricConsole] Minecraft Server instance registered.");
            
            // Initialize Web Server first so storage config loads
            WebServer.start();

            // Initialize Plugin Manager and bridges on startup
            PluginManager.init();
            ConsoleBridge.start();
        });

        // Defer Spark start to SERVER_STARTED so SparkProvider has finished initializing
        ServerLifecycleEvents.SERVER_STARTED.register(server -> {
            System.out.println("[BetterFabricConsole] Server fully started, initializing Spark bridge...");
            PluginManager.startSpark();
        });

        ServerLifecycleEvents.SERVER_STOPPING.register(server -> {
            System.out.println("[BetterFabricConsole] Stopping mod services...");
            ConsoleBridge.stop();
            PluginManager.stopSpark();
            WebServer.stop();
            serverInstance = null;
        });
    }

    public static MinecraftServer getServer() {
        return serverInstance;
    }

    /**
     * Executes a command on the server main thread as system command source.
     */
    public static void executeCommand(String command) {
        if (serverInstance != null) {
            serverInstance.execute(() -> {
                try {
                    serverInstance.getCommands().performPrefixedCommand(
                        serverInstance.createCommandSourceStack(),
                        command
                    );
                } catch (Exception e) {
                    System.err.println("[BetterFabricConsole] Command execution error: " + e.getMessage());
                }
            });
        } else {
            System.err.println("[BetterFabricConsole] Cannot execute command: Server not running.");
        }
    }
}
