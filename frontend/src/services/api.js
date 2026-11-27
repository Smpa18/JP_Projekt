import axios from "axios";

// Die Basis-Adresse deines Spring Boot Backends.
// Läuft lokal auf Port 8080 (siehe application.properties).
const API_BASE_URL = "http://localhost:8080/api";

// Erstellt eine "vorkonfigurierte" Axios-Instanz, damit wir nicht
// jedes Mal die volle URL schreiben müssen.
const api = axios.create({
    baseURL: API_BASE_URL,
});

// ============================================================
//  INTERCEPTOR - läuft automatisch VOR JEDER Anfrage
// ============================================================
// Fügt das gespeicherte JWT-Token automatisch zum
// "Authorization" Header hinzu (genau das, was wir vorher
// händisch in Postman gemacht haben).
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;