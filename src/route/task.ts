import { Router } from 'express';
import * as  taskController from 'src/controller/task';

const router = Router();

router.get('/', taskController.retrieve);
router.post('/', taskController.create);

export default router;
