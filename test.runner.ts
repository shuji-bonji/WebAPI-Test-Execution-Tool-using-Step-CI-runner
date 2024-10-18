
import { CommandOptions } from './test.reporter';
import { parseCommandLineOptions } from './test.utils';
import { TestExecutor } from './test.executor'
import { commonEnvVar } from './test.env';
import { testYamls } from './workflows';

const option: CommandOptions = parseCommandLineOptions(process.argv.slice(2));
new TestExecutor(option, commonEnvVar).execute(testYamls);
