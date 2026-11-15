-- DuckDB / SQL schema placeholders for SpeedDemon-- DuckDB example schema for SpeedDemon












);    gear INTEGER    speed DOUBLE,    lap_time DOUBLE,    track VARCHAR,    driver VARCHAR,    timestamp TIMESTAMP,    id BIGINT,CREATE TABLE IF NOT EXISTS telemetry (-- Example telemetry table (adjust columns to match incoming data)
CREATE TABLE IF NOT EXISTS telemetry (
    session_id TEXT,
    timestamp TIMESTAMP,
    vehicle_id TEXT,
    speed DOUBLE,
    throttle DOUBLE,
    brake DOUBLE,
    steering DOUBLE
);

CREATE TABLE IF NOT EXISTS laps (
    lap_id TEXT,
    session_id TEXT,
    driver_id TEXT,
    lap_time DOUBLE
);
