import { useState, useEffect } from "react";
import api from "../services/api";

export function HistoriqueDossier({dossierId}) {

    const [historique, setHistorique] = useState([]);
    const [chargement, setChargement] = useState(true);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability
        chargerHistorique();
    }, [dossierId]);

    /**
     * Lädt alle Historique-Einträge vom Backend.
     */
    async function chargerHistorique() {
        setChargement(true);
        try {
            const res = await api.get(`/dossiers/${dossierId}/historique`);
            setHistorique(res.data);
        } catch {
            // Kein Fehler anzeigen wenn keine Historique vorhanden
        } finally {
            setChargement(false);
        }
    }

    if (chargement) return null;
    if (historique.length === 0) return null;

    return (
        <div style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "24px",
            marginTop: "24px",
        }}>
            {/* Titel */}
            <h3 style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "var(--color-primary-dark)",
                marginBottom: "24px",
                paddingBottom: "12px",
                borderBottom: "2px solid var(--color-primary-light)",
            }}>
                📋 Historique du dossier
            </h3>

            {/* Timeline */}
            <div style={{display: "flex", flexDirection: "column", gap: "0"}}>
                {historique.map((h, index) => (
                    <div key={h.id} style={{
                        display: "flex",
                        gap: "20px",
                        position: "relative",
                    }}>
                        {/* Linie + Punkt */}
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: "20px",
                        }}>
                            {/* Punkt */}
                            <div style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                backgroundColor: "var(--color-primary)",
                                border: "3px solid var(--color-primary-light)",
                                marginTop: "4px",
                                flexShrink: 0,
                            }}/>
                            {/* Linie nach unten — nicht beim letzten Element */}
                            {index < historique.length - 1 && (
                                <div style={{
                                    width: "2px",
                                    flex: 1,
                                    backgroundColor: "var(--color-border)",
                                    minHeight: "40px",
                                }}/>
                            )}
                        </div>

                        {/* Inhalt */}
                        <div style={{
                            flex: 1,
                            paddingBottom: index < historique.length - 1 ? "24px" : "0",
                        }}>
                            {/* Datum */}
                            <div style={{
                                fontSize: "13px",
                                color: "var(--color-text-muted)",
                                marginBottom: "4px",
                            }}>
                                📅 {new Date(h.dateAction).toLocaleDateString("fr-CD", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                            </div>

                            {/* Beschreibung — groß und klar */}
                            <div style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "var(--color-text)",
                                marginBottom: "4px",
                            }}>
                                {h.description}
                            </div>

                            {/* Wer hat es gemacht */}
                            {h.effectuePar && (
                                <div style={{
                                    fontSize: "14px",
                                    color: "var(--color-text-muted)",
                                }}>
                                    👤 {h.effectuePar}
                                </div>
                            )}

                            {/* Stade-Änderung */}
                            {h.stadeAvant && h.stadeApres && h.stadeAvant !== h.stadeApres && (
                                <div style={{
                                    marginTop: "6px",
                                    fontSize: "12px",
                                    color: "var(--color-text-muted)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}>
                                    <span style={{
                                        background: "var(--color-background)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "4px",
                                        padding: "2px 8px",
                                    }}>{h.stadeAvant}</span>
                                    →
                                    <span style={{
                                        background: "var(--color-primary-light)",
                                        border: "1px solid var(--color-primary)",
                                        borderRadius: "4px",
                                        padding: "2px 8px",
                                        color: "var(--color-primary-dark)",
                                        fontWeight: "600",
                                    }}>{h.stadeApres}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}