const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { validateParsedDocument } = require('../validations/gemini.validation');
const { getPrompt } = require('./gemini/prompts');
const { getResponseSchema } = require('./gemini/schemas');

const FILE_POLL_INTERVAL_MS = 2000;
const FILE_POLL_MAX_ATTEMPTS = 30;

let genAiModulePromise;

async function loadGenAiModule() {
  if (!genAiModulePromise) {
    genAiModulePromise = import('@google/genai');
  }
  return genAiModulePromise;
}

async function getGeminiClient() {
  const { GoogleGenAI } = await loadGenAiModule();
  return new GoogleGenAI({ apiKey: config.gemini.apiKey });
}

function assertGeminiConfigured() {
  if (!config.gemini.apiKey) {
    throw new ApiError(
      503,
      'GEMINI_NOT_CONFIGURED',
      'GEMINI_API_KEY is not set. Document parsing is unavailable.'
    );
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForFileReady(ai, fileName) {
  let file = await ai.files.get({ name: fileName });

  for (let attempt = 0; attempt < FILE_POLL_MAX_ATTEMPTS; attempt += 1) {
    if (file.state === 'ACTIVE') {
      return file;
    }

    if (file.state === 'FAILED') {
      throw new ApiError(400, 'PARSE_ERROR', 'Gemini failed to process the uploaded file');
    }

    await sleep(FILE_POLL_INTERVAL_MS);
    file = await ai.files.get({ name: fileName });
  }

  throw new ApiError(408, 'PARSE_TIMEOUT', 'Timed out waiting for Gemini to process the file');
}

async function uploadFileToGemini(ai, filePath, mimeType) {
  const uploaded = await ai.files.upload({
    file: filePath,
    config: { mimeType },
  });

  if (!uploaded.name) {
    throw new ApiError(400, 'PARSE_ERROR', 'Gemini file upload did not return a file name');
  }

  return waitForFileReady(ai, uploaded.name);
}

async function deleteGeminiFile(ai, fileName) {
  if (!fileName) {
    return;
  }

  try {
    await ai.files.delete({ name: fileName });
  } catch (err) {
    logger.warn('Failed to delete Gemini file', { fileName, message: err.message });
  }
}

function parseJsonResponse(rawText) {
  try {
    return JSON.parse(rawText);
  } catch (err) {
    throw new ApiError(400, 'PARSE_ERROR', 'Gemini returned invalid JSON');
  }
}

function normalizeItemCodes(payload) {
  if (!payload.items || !Array.isArray(payload.items)) {
    return payload;
  }

  return {
    ...payload,
    items: payload.items.map((item) => ({
      ...item,
      itemCode: item.itemCode != null ? String(item.itemCode).trim() : item.itemCode,
    })),
  };
}

function validateGeminiPayload(documentType, payload) {
  const normalized = normalizeItemCodes(payload);
  const { error, value } = validateParsedDocument(documentType, normalized);

  if (error) {
    const message = error.details.map((detail) => detail.message).join('; ');
    throw new ApiError(400, 'PARSE_VALIDATION_ERROR', message);
  }

  return value;
}

async function requestStructuredParse(ai, uploadedFile, documentType) {
  const { createPartFromUri, createUserContent } = await loadGenAiModule();
  const prompt = getPrompt(documentType);
  const responseSchema = getResponseSchema(documentType);

  const response = await ai.models.generateContent({
    model: config.gemini.model,
    contents: createUserContent([
      createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
      prompt,
    ]),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: responseSchema,
      temperature: 0,
    },
  });

  const rawText = response.text;

  if (!rawText) {
    throw new ApiError(400, 'PARSE_ERROR', 'Gemini returned an empty response');
  }

  return rawText;
}

async function parseWithGemini(ai, uploadedFile, documentType) {
  const rawText = await requestStructuredParse(ai, uploadedFile, documentType);
  const parsedJson = parseJsonResponse(rawText);
  const validated = validateGeminiPayload(documentType, parsedJson);

  return { parsed: validated, rawParsed: parsedJson, rawText };
}

async function parseDocument(file, documentType) {
  assertGeminiConfigured();

  const ai = await getGeminiClient();
  let uploadedFile;

  try {
    uploadedFile = await uploadFileToGemini(ai, file.path, file.mimetype);

    try {
      return await parseWithGemini(ai, uploadedFile, documentType);
    } catch (firstError) {
      logger.warn('Gemini parse failed, retrying once', {
        documentType,
        message: firstError.message,
      });

      try {
        return await parseWithGemini(ai, uploadedFile, documentType);
      } catch (retryError) {
        if (retryError instanceof ApiError) {
          throw retryError;
        }
        throw new ApiError(400, 'PARSE_ERROR', retryError.message);
      }
    }
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    logger.error('Gemini parse failed', { documentType, message: err.message, stack: err.stack });
    throw new ApiError(400, 'PARSE_ERROR', 'Failed to parse document with Gemini');
  } finally {
    if (uploadedFile?.name) {
      await deleteGeminiFile(ai, uploadedFile.name);
    }
  }
}

module.exports = { parseDocument };
