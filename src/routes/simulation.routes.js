import express from 'express';
import simulationController from '../controllers/simulation.controller.js';

const router = express.Router();

router.get('/random', simulationController.getRandomError);
router.get('/custom', simulationController.getCustomError);
router.get('/delay', simulationController.getDelayedResponse);
router.get('/chaos', simulationController.getChaosResponse);

export default router;
