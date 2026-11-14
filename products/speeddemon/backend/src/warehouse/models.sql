-- SQL models / joins for analytics

-- Example: aggregated lap stats
CREATE VIEW IF NOT EXISTS lap_stats AS
SELECT
    driver,
    COUNT(*) AS laps,
    AVG(lap_time) AS avg_lap_time,
    MIN(lap_time) AS best_lap
FROM laps
GROUP BY driver;
