import { CronJob } from 'cron';
import { updateDataSourceList } from 'src/controller/dataSource'
import config from 'src/config';

const updateDataSourceJob =
  config.need_update_datasource == 'true' ?
    new CronJob(
      '*/10 * * * * *', updateDataSourceList
    ) : null;


export default [
  updateDataSourceJob,
];