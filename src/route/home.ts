import { Router } from 'express';
import * as homeController from 'src/controller/home'

const router = Router();

router.get('/', homeController.index);


export default router;