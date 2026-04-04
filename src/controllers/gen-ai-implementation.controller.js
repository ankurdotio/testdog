import asyncHandler from '../utils/asyncHandler.js';
import genAiImplementationService from '../services/gen-ai-implementation.service.js';

class GenAiImplementationController {
  /**
   * Get the GenAI implementation guide.
   * @route GET /api/v1/gen-ai-implementation
   * @access Public
   */
  getGuide = asyncHandler(async (req, res) => {
    const mode = req.query.mode || 'all';
    const guide = genAiImplementationService.buildGuide(mode);

    res.status(200).json({
      success: true,
      message: 'GenAI implementation guide retrieved successfully',
      data: guide,
    });
  });

  /**
   * Run single-agent demo flow.
   * @route POST /api/v1/gen-ai-implementation/single/ask
   * @access Public
   */
  askSingle = asyncHandler(async (req, res) => {
    const { question } = req.body;
    const result = genAiImplementationService.runSingleAgentDemo(question);

    res.status(200).json({
      success: true,
      message: 'Single-agent demo response generated successfully',
      data: result,
    });
  });

  /**
   * Run multi-agent demo flow.
   * @route POST /api/v1/gen-ai-implementation/multi/ask
   * @access Public
   */
  askMulti = asyncHandler(async (req, res) => {
    const { question } = req.body;
    const result = genAiImplementationService.runMultiAgentDemo(question);

    res.status(200).json({
      success: true,
      message: 'Multi-agent demo response generated successfully',
      data: result,
    });
  });

  /**
   * Run LangGraph demo flow.
   * @route POST /api/v1/gen-ai-implementation/langgraph/ask
   * @access Public
   */
  askLangGraph = asyncHandler(async (req, res) => {
    const { question } = req.body;
    const result = genAiImplementationService.runLangGraphDemo(question);

    res.status(200).json({
      success: true,
      message: 'LangGraph demo response generated successfully',
      data: result,
    });
  });
}

export default new GenAiImplementationController();
