# StrokeSense Deployment Notes

## Current Deployment Flow

The deployed StrokeSense system uses this flow:

Frontend → Backend API → AI API

The frontend sends user health input to the backend. The backend validates the input and forwards it to the deployed AI API. The AI API returns the stroke risk prediction, and the backend sends the result back to the frontend.

## Backend

Backend hosting:

https://strokesense-backend.vercel.app

Health endpoint:

https://strokesense-backend.vercel.app/api/health

Prediction endpoint:

POST https://strokesense-backend.vercel.app/api/predict

## AI API

AI API hosting:

https://luthfi13wa-strokesense-ai-api.hf.space

Health endpoint:

https://luthfi13wa-strokesense-ai-api.hf.space/health

Prediction endpoint:

POST https://luthfi13wa-strokesense-ai-api.hf.space/predict

## Environment Variables

Backend environment variables:

PORT=3000
FRONTEND_URL=http://localhost:5173
AI_API_URL=https://luthfi13wa-strokesense-ai-api.hf.space/predict
AI_MODEL_VERSION=tensorflow-functional-api-v1

After the frontend is deployed, FRONTEND_URL must be changed to the deployed frontend URL.

## Notes

Prediction history currently uses in-memory storage for the MVP/demo version. This means history is not guaranteed to be permanent on serverless deployment. For future production usage, PostgreSQL or Supabase is recommended.
