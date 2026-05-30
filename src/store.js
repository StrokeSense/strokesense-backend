const predictions = [];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function createPrediction({ input, prediction, modelSource, modelVersion }) {
  const record = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    input,
    prediction,
    modelSource,
    modelVersion
  };

  predictions.push(record);

  return record;
}

export function listPredictions() {
  return predictions;
}

export function getPredictionById(id) {
  return predictions.find((prediction) => prediction.id === id) || null;
}

export function deletePrediction(id) {
  const index = predictions.findIndex((prediction) => prediction.id === id);

  if (index === -1) {
    return false;
  }

  predictions.splice(index, 1);
  return true;
}
