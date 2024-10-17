import { TestResult, WorkflowResult } from '@stepci/runner';

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
const printDefault = (workflowResult: WorkflowResult): void => {
  const resultStatus = getResultStatus(workflowResult);
  console.log(`${workflowResult.workflow.name} Result:`, resultStatus);
  if (resultStatus === 'FAILED') {
    printFailedTestsDetails(workflowResult);
  }
}
// 結果のステータスを取得する関数
const getResultStatus = (workflowResult: WorkflowResult): string => {
  return workflowResult.result.passed ? 'PASSED' : 'FAILED';
}
// 失敗したテストの詳細を印刷する関数
const printFailedTestsDetails = (workflowResult: WorkflowResult): void => {
  workflowResult.result.tests.forEach(testResult => {
    if (!testResult.passed) printFailedStepsDetails(testResult);
  });
}
// 失敗したステップの詳細を印刷する関数
const printFailedStepsDetails = (testResult: TestResult): void => {
  testResult.steps.forEach(stepResult => {
    if (!stepResult.passed) 
      console.log(`- Test ID: ${stepResult.name}, Error Message: ${stepResult.errorMessage}`);
  });
}

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
