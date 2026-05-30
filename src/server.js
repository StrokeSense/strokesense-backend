import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { getPrediction } from "./aiClient.js";
import {
  createPrediction,
  deletePrediction,
  getPredictionById,
  listPredictions
} from "./store.js";

dotenv.config();

const app = express();

const RAW_FEATURE_KEYS = [
  "age",
  "hypertension",
  "heart_disease",
  "ever_married",
  "work_type",
  "avg_glucose_level",
  "bmi",
  "smoking_status"
];

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(express.json());

function validatePredictionInput(input) {
  const errors = [];

  for (const key of RAW_FEATURE_KEYS) {
    if (input[key] === undefined || input[key] === null || input[key] === "") {
      errors.push(`${key} is required.`);
    }
  }

  const age = Number(input.age);
  const hypertension = Number(input.hypertension);
  const heartDisease = Number(input.heart_disease);
  const avgGlucoseLevel = Number(input.avg_glucose_level);
  const bmi = Number(input.bmi);

  if (!Number.isFinite(age) || age < 0 || age > 120) {
    errors.push("age must be a number between 0 and 120.");
  }

  if (![0, 1].includes(hypertension)) {
    errors.push("hypertension must be 0 or 1.");
  }

  if (![0, 1].includes(heartDisease)) {
    errors.push("heart_disease must be 0 or 1.");
  }

  if (!["Yes", "No"].includes(input.ever_married)) {
    errors.push("ever_married must be Yes or No.");
  }

  if (
    !["children", "Govt_job", "Never_worked", "Private", "Self-employed"].includes(
      input.work_type
    )
  ) {
    errors.push(
      "work_type must be one of children, Govt_job, Never_worked, Private, Self-employed."
    );
  }

  if (
    !Number.isFinite(avgGlucoseLevel) ||
    avgGlucoseLevel < 0 ||
    avgGlucoseLevel > 400
  ) {
    errors.push("avg_glucose_level must be a number between 0 and 400.");
  }

  if (!Number.isFinite(bmi) || bmi < 5 || bmi > 100) {
    errors.push("bmi must be a number between 5 and 100.");
  }

  if (
    !["formerly smoked", "never smoked", "smokes", "Unknown"].includes(
      input.smoking_status
    )
  ) {
    errors.push(
      "smoking_status must be one of formerly smoked, never smoked, smokes, Unknown."
    );
  }

  return errors;
}

function normalizeInput(input) {
  return {
    age: Number(input.age),
    hypertension: Number(input.hypertension),
    heart_disease: Number(input.heart_disease),
    ever_married: input.ever_married,
    work_type: input.work_type,
    avg_glucose_level: Number(input.avg_glucose_level),
    bmi: Number(input.bmi),
    smoking_status: input.smoking_status
  };
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "StrokeSense Backend API",
    status: "running",
    endpoints: {
      health: "/api/health",
      fields: "/api/fields",
      predict: "/api/predict",
      predictions: "/api/predictions"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    service: "StrokeSense Backend API",
    aiApiConfigured: Boolean(process.env.AI_API_URL),
    aiApiUrl: process.env.AI_API_URL || null,
    modelVersion: process.env.AI_MODEL_VERSION || "unknown"
  });
});

app.get("/api/fields", (req, res) => {
  res.json({
    success: true,
    data: {
      requiredFields: RAW_FEATURE_KEYS,
      options: {
        ever_married: ["Yes", "No"],
        work_type: [
          "children",
          "Govt_job",
          "Never_worked",
          "Private",
          "Self-employed"
        ],
        smoking_status: ["formerly smoked", "never smoked", "smokes", "Unknown"],
        hypertension: [0, 1],
        heart_disease: [0, 1]
      }
    }
  });
});

app.post("/api/predict", async (req, res) => {
  try {
    const errors = validatePredictionInput(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid prediction input.",
        errors
      });
    }

    const input = normalizeInput(req.body);
    const result = await getPrediction(input);

    const predictionRecord = createPrediction({
      input,
      prediction: result.prediction,
      modelSource: result.modelSource,
      modelVersion: result.modelVersion
    });

    return res.status(201).json({
      success: true,
      message: "Prediction created successfully.",
      data: predictionRecord
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create prediction.",
      error: error.message
    });
  }
});

app.get("/api/predictions", (req, res) => {
  res.json({
    success: true,
    data: listPredictions()
  });
});

app.get("/api/predictions/:id", (req, res) => {
  const prediction = getPredictionById(req.params.id);

  if (!prediction) {
    return res.status(404).json({
      success: false,
      message: "Prediction not found."
    });
  }

  return res.json({
    success: true,
    data: prediction
  });
});

app.delete("/api/predictions/:id", (req, res) => {
  const deleted = deletePrediction(req.params.id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Prediction not found."
    });
  }

  return res.json({
    success: true,
    message: "Prediction deleted successfully."
  });
});

export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`StrokeSense backend running on http://localhost:${PORT}`);
  });
}
