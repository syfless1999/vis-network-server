import { Router } from 'express';
import * as  dataSourceController from 'src/controller/dataSource'

const router = Router();

router.post('/', dataSourceController.create);

export default router;
