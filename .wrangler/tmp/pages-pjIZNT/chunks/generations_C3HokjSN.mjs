globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as apiClient } from './client_DXxObFE8.mjs';

async function generateFlashcards(data) {
  return apiClient.post("/api/generations", data);
}
async function getGenerationDetails(generationId) {
  return apiClient.get(`/api/generations/${generationId}`);
}

export { getGenerationDetails as a, generateFlashcards as g };
