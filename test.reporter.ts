import { WorkflowResult } from '@stepci/runner';

export type CommandOptions = { verbose: boolean, trace: boolean };

// option `-v`
const printVerbose = (workflowResult: WorkflowResult): void => {
  console.log(`!!!! ${workflowResult.workflow.name} : WorkFlow Result :!!!!`);
  console.log(workflowResult);
  console.log(`---- ${workflowResult.workflow.name} : Steps Result : ----`);
  workflowResult.result.tests.forEach(test => {
    console.log(test.steps)
  });
}

// option `-t`
const printTrace = (workflowResult: WorkflowResult): void => 
  console.log(JSON.stringify(workflowResult.result, null, 2));

// option none
const printDefault = (workflowResult: WorkflowResult): void =>
  console.log(`${workflowResult.workflow.name} Result:`,
    workflowResult.result.passed ? 'PASSED' : 'FAILED');

/** デフォルトの Result Reporter 関数*/
export const resultReporter = (option: CommandOptions, workflowResult: WorkflowResult) => {
  if (option.verbose) return printVerbose(workflowResult);
  if (option.trace) return printTrace(workflowResult);
  return printDefault(workflowResult);
  // return console.log;
}

/** カスタム Result Reporter 関数のサンプル*/
export const customResultReporterSample = (option: CommandOptions,  workflowResult: WorkflowResult) => {
  console.log('This Custom ResultReport Sample!!', 'option:', option);
  return resultReporter(option, workflowResult);
}
