### Naming Conventions for Data, Models, Notebooks, and Reports

### 📂 SpeedDemon Naming Conventions

| Category | Format / Convention | Examples |
| :--- | :--- | :--- |
| **Data (Bronze)** | `YYYYMMDD_source_name.parquet` | `20240315_fastf1_laps.parquet` |
| **Data (Silver/Gold)** | `entity_status.parquet` | `laps_cleansed.parquet`, `driver_standings.parquet` |
| **Notebooks** | `##_short_description.ipynb` | `01_telemetry_eda.ipynb`, `02_ridge_prototype.ipynb` |
| **Models** | `v##_algo_status.pkl` | `v01_lasso_baseline.pkl`, `v02_ridge_final.pkl` |
| **Reports** | `YYYY-MM-DD_report_name.png` | `2024-03-15_lap_time_variance.png` |