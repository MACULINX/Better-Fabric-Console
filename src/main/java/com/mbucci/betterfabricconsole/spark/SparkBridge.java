package com.mbucci.betterfabricconsole.spark;

import me.lucko.spark.api.Spark;
import me.lucko.spark.api.SparkProvider;
import me.lucko.spark.api.statistic.StatisticWindow;
import me.lucko.spark.api.statistic.types.DoubleStatistic;

import com.mbucci.betterfabricconsole.plugin.PluginManager;
import com.mbucci.betterfabricconsole.web.WebServer;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class SparkBridge {
    private static ScheduledExecutorService scheduler = null;
    private static boolean running = false;

    public static synchronized void start() {
        if (!PluginManager.isSparkAvailable() || running) return;
        
        System.out.println("[BetterFabricConsole] Starting Spark metric collector...");
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "BetterFabricConsole-Spark-Collector");
            t.setDaemon(true);
            return t;
        });

        scheduler.scheduleAtFixedRate(SparkBridge::collectAndSendMetrics, 5, 5, TimeUnit.SECONDS);
        running = true;
    }

    public static synchronized void stop() {
        if (!running) return;
        System.out.println("[BetterFabricConsole] Stopping Spark metric collector...");
        if (scheduler != null) {
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(1, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                scheduler.shutdownNow();
            }
            scheduler = null;
        }
        running = false;
    }

    private static void collectAndSendMetrics() {
        if (!PluginManager.isSparkAvailable()) return;

        try {
            Spark spark;
            try {
                spark = SparkProvider.get();
            } catch (IllegalStateException e) {
                // Spark API is not initialized yet (early startup)
                return;
            }
            if (spark == null) return;

            // Get TPS metrics
            DoubleStatistic<StatisticWindow.TicksPerSecond> tpsStat = spark.tps();
            double tps10s = tpsStat != null ? tpsStat.poll(StatisticWindow.TicksPerSecond.SECONDS_10) : 20.0;
            double tps1m = tpsStat != null ? tpsStat.poll(StatisticWindow.TicksPerSecond.MINUTES_1) : 20.0;

            // Get CPU usage
            DoubleStatistic<StatisticWindow.CpuUsage> cpuProcessStat = spark.cpuProcess();
            DoubleStatistic<StatisticWindow.CpuUsage> cpuSystemStat = spark.cpuSystem();
            double cpuProcess = cpuProcessStat != null ? cpuProcessStat.poll(StatisticWindow.CpuUsage.MINUTES_1) : 0.0;
            double cpuSystem = cpuSystemStat != null ? cpuSystemStat.poll(StatisticWindow.CpuUsage.MINUTES_1) : 0.0;

            // Get JVM Memory
            long freeMem = Runtime.getRuntime().freeMemory();
            long totalMem = Runtime.getRuntime().totalMemory();
            long maxMem = Runtime.getRuntime().maxMemory();
            
            double usedMemoryMB = (double) (totalMem - freeMem) / (1024 * 1024);
            double maxMemoryMB = (double) maxMem / (1024 * 1024);

            // Forward to web service
            WebServer.updateMetrics(
                tps10s, 
                tps1m, 
                cpuProcess * 100.0, 
                cpuSystem * 100.0, 
                usedMemoryMB, 
                maxMemoryMB
            );
        } catch (Throwable t) {
            System.err.println("[BetterFabricConsole] Error collecting Spark metrics: " + t.getMessage());
            t.printStackTrace();
        }
    }
}
