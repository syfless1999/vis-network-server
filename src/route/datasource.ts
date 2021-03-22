import { Router } from 'express';
import * as  dataSourceController from 'src/controller/datasource'

const router = Router();

router.get('/', dataSourceController.read);
router.post('/', dataSourceController.create);

export default router;
