import { Router } from 'express';
import * as  userController from 'src/controller/user'

const router = Router();

router.post('/',userController.create);
router.get('/total', userController.getTotal);

export default router;
