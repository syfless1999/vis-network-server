import { Router } from 'express';
import * as networkController from 'src/controller/network';

const router = Router();

router.get('/', networkController.retrieve);
router.get('/:taskId', networkController.retrieveLayer);
router.post('/complete', networkController.completeLayer);

export default router;
