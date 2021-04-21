import { Router } from 'express';
import * as networkController from 'src/controller/network';

const router = Router();

router.get('/around', networkController.readAroundNetwork);
router.get('/layer', networkController.readNetwork);
router.post('/complete', networkController.completeNetwork);

export default router;
