# ML Artifacts

Place trained model artifacts in this directory before building the Docker image.

## Expected files

| File | Description |
|------|-------------|
| `lstm_air_quality_model.keras/` | Keras SavedModel directory (config.json + model.weights.h5 + metadata.json) |
| `time_scaler.pkl` | Joblib-serialised `MinMaxScaler` fitted on `[Hour, DayOfWeek, Month]` columns |

## Model input / output

- **Input shape** : `(batch, 24, 15)` — 24-hour lookback window, 15 features
- **Output shape**: `(batch, 4)` — `[PM2.5, PM10, NO2, SO2]` in µg/m³

## Feature order (must match training exactly)

```
PM2.5, PM10, NO, NO2, NOX, NH3, SO2,
RH, WD, AT, WS, Hour, DayOfWeek, Month, WD
```

`Hour`, `DayOfWeek`, and `Month` are passed through `time_scaler` before inference.
All other features are in raw physical units.
