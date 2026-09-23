import express from 'express';
import genAiImplementationController from '../controllers/gen-ai-implementation.controller.js';

const router = express.Router();

router.route('/').get(genAiImplementationController.getGuide);
router.route('/single/ask').post(genAiImplementationController.askSingle);
router.route('/multi/ask').post(genAiImplementationController.askMulti);
router
    .route('/langgraph/ask')
    .post(genAiImplementationController.askLangGraph);

export default router;