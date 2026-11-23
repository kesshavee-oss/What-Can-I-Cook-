import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { buildPrompt, buildRecipeTipsPrompt } from './src/utils/aiRecipes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length === 0) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  const ai = getAiClient();
  res.json({
    ok: true,
    aiAvailable: Boolean(ai),
  });
});

app.post('/api/recipes/suggest', async (req, res) => {
  const ai = getAiClient();
  if (!ai) {
    return res.status(503).json({
      code: 'KEY_UNAVAILABLE',
      error: 'AI suggestions are not available right now',
    });
  }

  try {
    // Only extract sanitized kitchen filters & counts (never names, dates, notes, or cooked history)
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const diet = body.diet === 'nonveg' ? 'nonveg' : 'veg';
    const mealType = ['breakfast', 'lunch', 'snacks', 'dinner'].includes(body.mealType)
      ? body.mealType
      : 'dinner';
    const selectedIngredientIds = Array.isArray(body.selectedIngredientIds)
      ? body.selectedIngredientIds.filter((id: unknown): id is string => typeof id === 'string')
      : [];
    const allergies = Array.isArray(body.allergies)
      ? body.allergies.filter((a: unknown): a is string => typeof a === 'string')
      : [];
    const adultsCount = Math.max(1, Number(body.adultsCount) || 1);
    const childrenCount = Math.max(0, Number(body.childrenCount) || 0);

    const prompt = buildPrompt({
      selectedIngredientIds,
      diet,
      mealType,
      allergies,
      adultsCount,
      childrenCount,
    });

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a practical home kitchen recipe assistant. Return ONLY a JSON array of 3 concise home-cooked recipes matching the requested schema, using only allowed ingredientId values.',
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              source: { type: Type.STRING },
              name: { type: Type.STRING },
              mealTypes: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  enum: ['breakfast', 'lunch', 'snacks', 'dinner'],
                },
              },
              diet: {
                type: Type.STRING,
                enum: ['veg', 'nonveg'],
              },
              allergens: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              cuisine: { type: Type.STRING },
              difficulty: {
                type: Type.STRING,
                enum: ['easy', 'medium', 'hard'],
              },
              prepMinutes: { type: Type.NUMBER },
              cookMinutes: { type: Type.NUMBER },
              baseServings: { type: Type.NUMBER },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ingredientId: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    optional: { type: Type.BOOLEAN },
                  },
                  required: ['ingredientId', 'amount', 'unit', 'optional'],
                },
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    timerSeconds: { type: Type.NUMBER, nullable: true },
                  },
                  required: ['text'],
                },
              },
              nutritionPerServing: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  calcium: { type: Type.NUMBER },
                  iron: { type: Type.NUMBER },
                  vitaminC: { type: Type.NUMBER },
                  fiber: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                },
                required: ['calories', 'protein', 'fat', 'carbs'],
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'name',
              'mealTypes',
              'diet',
              'ingredients',
              'steps',
              'nutritionPerServing',
            ],
          },
        },
      },
    });

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => {
        const timeoutErr = new Error('Request timed out');
        timeoutErr.name = 'AbortError';
        reject(timeoutErr);
      }, 19500);
    });

    let response;
    try {
      response = await Promise.race([generatePromise, timeoutPromise]);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }

    return res.json({ rawText: (response.text ?? '').trim() });
  } catch (err: unknown) {
    const errObj = err as { status?: number; code?: string | number; message?: string; name?: string };
    const status = Number(errObj?.status || errObj?.code || 0);
    const msg = String(errObj?.message || '');
    const lowerMsg = msg.toLowerCase();

    console.error('AI recipe suggestion error:', {
      status: status || undefined,
      code: errObj?.code,
      name: errObj?.name,
      message: msg,
    });

    if (errObj?.name === 'AbortError' || lowerMsg.includes('timed out')) {
      return res.status(504).json({
        code: 'TIMEOUT',
        error: 'Request timed out. You can retry or use built-in recipes.',
      });
    }

    if (
      status === 429 ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      lowerMsg.includes('quota') ||
      lowerMsg.includes('rate limit')
    ) {
      return res.status(429).json({
        code: 'RATE_LIMIT',
        error: 'AI suggestions are not available right now',
      });
    }

    if (
      status === 401 ||
      status === 403 ||
      msg.includes('API_KEY_INVALID') ||
      msg.includes('PERMISSION_DENIED') ||
      (status === 400 && lowerMsg.includes('api key'))
    ) {
      return res.status(403).json({
        code: 'KEY_ERROR',
        error: 'AI suggestions are not available right now',
      });
    }

    return res.status(502).json({
      code: 'UPSTREAM_ERROR',
      error: 'Could not create recipes right now. Try again.',
    });
  }
});

app.post('/api/recipes/tips', async (req, res) => {
  const ai = getAiClient();
  if (!ai) {
    return res.status(503).json({
      code: 'KEY_UNAVAILABLE',
      error: 'AI cooking tips are not available right now',
    });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const recipeName =
      typeof body.recipeName === 'string' ? body.recipeName.trim().slice(0, 120) : '';
    if (!recipeName) {
      return res.status(400).json({
        code: 'INVALID_INPUT',
        error: 'Recipe name is required.',
      });
    }

    const diet = body.diet === 'nonveg' ? 'nonveg' : 'veg';
    const cuisine =
      typeof body.cuisine === 'string' ? body.cuisine.trim().slice(0, 60) : 'Home-cooked';
    const ingredientNames = Array.isArray(body.ingredientNames)
      ? body.ingredientNames
          .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
          .slice(0, 30)
      : [];
    const stepTexts = Array.isArray(body.stepTexts)
      ? body.stepTexts
          .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
          .slice(0, 20)
      : [];
    const allergies = Array.isArray(body.allergies)
      ? body.allergies
          .filter((a: unknown): a is string => typeof a === 'string' && a.trim().length > 0)
          .slice(0, 12)
      : [];

    const prompt = buildRecipeTipsPrompt({
      recipeName,
      diet,
      cuisine,
      ingredientNames,
      stepTexts,
      allergies,
    });

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a helpful home-kitchen chef. Provide practical pro tips and ingredient substitutions for the requested recipe as valid JSON only, strictly respecting the dietary preference and allergies.',
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            proTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 4 concise, practical cooking pro tips for this exact recipe.',
            },
            substitutions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ingredient: {
                    type: Type.STRING,
                    description: 'Name of an ingredient used in this recipe.',
                  },
                  substitute: {
                    type: Type.STRING,
                    description: 'Common kitchen substitute that respects the diet and allergy rules.',
                  },
                  reason: {
                    type: Type.STRING,
                    description: 'Brief note on ratio or how it affects taste/texture.',
                  },
                },
                required: ['ingredient', 'substitute', 'reason'],
              },
              description: '3 to 4 common ingredient substitutions for this recipe.',
            },
          },
          required: ['proTips', 'substitutions'],
        },
      },
    });

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => {
        const timeoutErr = new Error('Request timed out');
        timeoutErr.name = 'AbortError';
        reject(timeoutErr);
      }, 19500);
    });

    let response;
    try {
      response = await Promise.race([generatePromise, timeoutPromise]);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }

    return res.json({ rawText: (response.text ?? '').trim() });
  } catch (err: unknown) {
    const errObj = err as { status?: number; code?: string | number; message?: string; name?: string };
    const status = Number(errObj?.status || errObj?.code || 0);
    const msg = String(errObj?.message || '');
    const lowerMsg = msg.toLowerCase();

    console.error('AI recipe tips error:', {
      status: status || undefined,
      code: errObj?.code,
      name: errObj?.name,
      message: msg,
    });

    if (errObj?.name === 'AbortError' || lowerMsg.includes('timed out')) {
      return res.status(504).json({
        code: 'TIMEOUT',
        error: 'Request timed out. Please try again.',
      });
    }

    if (
      status === 429 ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      lowerMsg.includes('quota') ||
      lowerMsg.includes('rate limit')
    ) {
      return res.status(429).json({
        code: 'RATE_LIMIT',
        error: 'AI cooking tips are not available right now',
      });
    }

    if (
      status === 401 ||
      status === 403 ||
      msg.includes('API_KEY_INVALID') ||
      msg.includes('PERMISSION_DENIED') ||
      (status === 400 && lowerMsg.includes('api key'))
    ) {
      return res.status(403).json({
        code: 'KEY_ERROR',
        error: 'AI cooking tips are not available right now',
      });
    }

    return res.status(502).json({
      code: 'UPSTREAM_ERROR',
      error: 'Could not get cooking tips right now. Try again.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
