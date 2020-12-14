import { Router } from 'express';
import * as  movieController from 'src/controller/movie'

const router = Router();

router.get('/total', movieController.getTotal);

export default router;
