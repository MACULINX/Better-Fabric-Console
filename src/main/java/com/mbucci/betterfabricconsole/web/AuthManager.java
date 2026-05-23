package com.mbucci.betterfabricconsole.web;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

public class AuthManager {
    private static final ConcurrentHashMap<String, Long> activeSessions = new ConcurrentHashMap<>();

    public static String hashPassword(String password) {
        if (password == null) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    public static boolean verifyPassword(String plain, String storedHash) {
        if (plain == null || storedHash == null || storedHash.isEmpty()) {
            return false;
        }
        return hashPassword(plain).equals(storedHash);
    }

    public static String createSession() {
        String token = UUID.randomUUID().toString();
        long expiryMinutes = Storage.getConfig().sessionTimeoutMinutes;
        if (expiryMinutes <= 0) {
            expiryMinutes = 1440; // fallback to 24h
        }
        long expiryTime = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(expiryMinutes);
        activeSessions.put(token, expiryTime);
        return token;
    }

    public static boolean validateToken(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }
        Long expiry = activeSessions.get(token);
        if (expiry == null) {
            return false;
        }
        if (System.currentTimeMillis() > expiry) {
            activeSessions.remove(token);
            return false;
        }
        // Update session expiry time (sliding window)
        long expiryMinutes = Storage.getConfig().sessionTimeoutMinutes;
        if (expiryMinutes <= 0) {
            expiryMinutes = 1440;
        }
        activeSessions.put(token, System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(expiryMinutes));
        return true;
    }

    public static boolean isInitialized() {
        String hash = Storage.getConfig().masterPasswordHash;
        return hash != null && !hash.trim().isEmpty();
    }

    public static synchronized boolean setup(String password) {
        if (isInitialized()) {
            return false; // Can't setup if already initialized
        }
        if (password == null || password.trim().isEmpty()) {
            return false;
        }
        Storage.getConfig().masterPasswordHash = hashPassword(password);
        Storage.saveConfig();
        return true;
    }

    public static void logout(String token) {
        if (token != null) {
            activeSessions.remove(token);
        }
    }
}
