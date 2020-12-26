import { Router } from 'express';
import * as  dataSourceController from 'src/controller/datasource'

const router = Router();

router.post('/', dataSourceController.create);

export default router;
