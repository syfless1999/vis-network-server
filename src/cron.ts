import { CronJob } from 'cron';
import { updateDataSourceCron } from 'src/controller/datasource'
import config from 'src/config';

const updateDataSourceJob =
  config.need_update_datasource == 'true' ?
    new CronJob(
      '*/10 * * * * *', updateDataSourceCron
    ) : null;


export default [
  updateDataSourceJob,
];