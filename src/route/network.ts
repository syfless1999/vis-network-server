import { Router } from 'express';
import * as  networkController from 'src/controller/network';

const router = Router();

router.get('/', networkController.retrieve);

export default router;
