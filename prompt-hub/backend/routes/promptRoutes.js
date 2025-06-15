import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import pg from 'pg';
import { testOpenAIPrompt } from '../services/openaiService.js';
import { testAnthropicPrompt } from '../services/anthropicService.js';
import { testGoogleGeminiPrompt } from '../services/googleAIService.js';

const router = express.Router();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const FREE_PROMPT_LIMIT = 5;

// Helper function to get local user ID and plan tier from Firebase UID
const getLocalUserAndPlan = async (firebaseUid) => {
  const userRes = await pool.query('SELECT id, plan_tier FROM users WHERE auth_provider_id = $1', [firebaseUid]);
  if (userRes.rows.length === 0) {
    throw new Error('User not found in local database.');
  }
  return userRes.rows[0]; // { id, plan_tier }
};


// POST /api/prompts/test-prompt - Test a prompt with an AI model
router.post('/test-prompt', authMiddleware, async (req, res) => {
  const { prompt_text, model_id } = req.body;

  if (!prompt_text || !model_id) {
    return res.status(400).json({ message: 'Prompt text and model ID are required.' });
  }

  try {
    let aiResponse;
    if (model_id === 'chatgpt') {
      aiResponse = await testOpenAIPrompt(prompt_text);
    } else if (model_id === 'claude') {
      aiResponse = await testAnthropicPrompt(prompt_text);
    } else if (model_id === 'gemini') {
      aiResponse = await testGoogleGeminiPrompt(prompt_text);
    } else {
      return res.status(400).json({ message: 'Invalid model ID specified.' });
    }
    res.status(200).json({ success: true, response: aiResponse });
  } catch (error) {
    console.error(`Error testing prompt with ${model_id}:`, error);
    res.status(500).json({ success: false, message: error.message || `Server error while testing prompt with ${model_id}.` });
  }
});

// POST /api/prompts - Create a new prompt
router.post('/', authMiddleware, async (req, res) => {
  const { title, prompt_text, model_used, tags } = req.body;
  const firebaseUid = req.user.uid;

  if (!prompt_text || !model_used) {
    return res.status(400).json({ message: 'Prompt text and model used are required.' });
  }

  try {
    const user = await getLocalUserAndPlan(firebaseUid); // Get user's ID and plan_tier
    const localUserId = user.id;
    const planTier = user.plan_tier || 'free';

    if (planTier !== 'pro') { // Only check limit if not pro
      const countRes = await pool.query('SELECT COUNT(*) FROM prompts WHERE user_id = $1', [localUserId]);
      const promptCount = parseInt(countRes.rows[0].count, 10);
      if (promptCount >= FREE_PROMPT_LIMIT) {
        return res.status(403).json({ message: `Free tier limit of ${FREE_PROMPT_LIMIT} prompts reached. Upgrade to Pro for unlimited prompts.` });
      }
    }

    const finalTitle = title || prompt_text.substring(0, 50) + (prompt_text.length > 50 ? '...' : '');
    const tagsToInsert = Array.isArray(tags) ? tags : [];

    const newPrompt = await pool.query(
      'INSERT INTO prompts (user_id, title, prompt_text, model_used, tags, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [localUserId, finalTitle, prompt_text, model_used, tagsToInsert]
    );
    res.status(201).json(newPrompt.rows[0]);
  } catch (error) {
    console.error('Error creating prompt:', error);
    if (error.message === 'User not found in local database.') {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating prompt.' });
  }
});

// GET /api/prompts - List user's prompts (with search and tag filters)
router.get('/', authMiddleware, async (req, res) => {
  const firebaseUid = req.user.uid;
  const { search, tag } = req.query;

  try {
    // We need localUserId for filtering, and plan_tier for context if needed (though not directly used in query result here)
    const user = await getLocalUserAndPlan(firebaseUid);
    const localUserId = user.id;

    let queryText = 'SELECT id, title, prompt_text, model_used, tags, created_at FROM prompts WHERE user_id = $1';
    const queryParams = [localUserId];
    let paramIndex = 2;

    if (search) {
      queryText += ` AND (title ILIKE $${paramIndex} OR prompt_text ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (tag) {
      queryText += ` AND tags @> ARRAY[$${paramIndex}::TEXT]`;
      queryParams.push(tag);
      paramIndex++;
    }
    queryText += ' ORDER BY created_at DESC';

    const userPrompts = await pool.query(queryText, queryParams);

    const countRes = await pool.query('SELECT COUNT(*) FROM prompts WHERE user_id = $1', [localUserId]);
    const promptCount = parseInt(countRes.rows[0].count, 10);

    res.status(200).json({
        prompts: userPrompts.rows,
        promptCount: promptCount,
        promptLimit: planTier === 'pro' ? Infinity : FREE_PROMPT_LIMIT, // Show Infinity for pro users
        planTier: user.plan_tier || 'free' // Also return plan tier
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    if (error.message === 'User not found in local database.') {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while fetching prompts.' });
  }
});

// GET /api/prompts/:id - Get a single prompt by ID
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const firebaseUid = req.user.uid;

  try {
    const user = await getLocalUserAndPlan(firebaseUid); // Use existing helper
    const localUserId = user.id;

    const promptRes = await pool.query(
      'SELECT id, title, prompt_text, model_used, tags FROM prompts WHERE id = $1 AND user_id = $2',
      [id, localUserId]
    );

    if (promptRes.rows.length === 0) {
      return res.status(404).json({ message: 'Prompt not found or access denied.' });
    }
    res.status(200).json(promptRes.rows[0]);
  } catch (error) {
    console.error('Error fetching single prompt:', error);
    if (error.message === 'User not found in local database.') {
        return res.status(401).json({ message: 'Unauthorized: User mapping failed.' });
    }
    res.status(500).json({ message: 'Server error while fetching prompt.' });
  }
});

export default router;
