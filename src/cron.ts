import { CronJob } from 'cron';
import { fetchDataSourceCron } from 'src/controller/datasource'

import config from 'src/config';
import { handleTaskCron } from './controller/task';


function initCronJob(needCron: boolean = false, cron: string, controller: () => Promise<void>): CronJob {
  const cronJob = needCron == true ?
    new CronJob(
      cron,
      controller,
    ) : null;
  return cronJob;
}

const updateDataSourceJob = initCronJob(
  config.need_update_datasource,
  config.datasource_fetch_cron,
  fetchDataSourceCron,
);

const handleTaskJob = initCronJob(
  config.need_task_handle,
  config.task_handle_cron,
  handleTaskCron,
);

const cronJobs: Array<CronJob> = [
  updateDataSourceJob,
  handleTaskJob,
];

export default cronJobs;