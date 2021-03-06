import { Router } from 'express';
import * as  taskController from 'src/controller/task';

const router = Router();

router.get('/:id', taskController.readOneTask);
router.get('/', taskController.read);
router.post('/', taskController.create);

export default router;
