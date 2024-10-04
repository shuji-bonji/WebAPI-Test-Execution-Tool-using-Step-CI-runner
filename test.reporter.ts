import { WorkflowResult } from '@stepci/runner';

/** テスト結果を表示するインターフェース */
export interface IResultReporter {
  reportResult(workResult: WorkflowResult): void;
}

export type CommandOptions = { verbose: boolean, trace: boolean };

/**  テスト結果を表示するクラス */
export class ResultReporter implements IResultReporter {
  private verbose: boolean;
  private trace: boolean;

  constructor(options: CommandOptions) {
    this.verbose = options.verbose;
    this.trace = options.trace;
  }

  /** 結果リポートする */
  reportResult(workflowResult: WorkflowResult) {
    if (this.verbose) this.printVerbose(workflowResult);
    if (this.trace) this.printTrace(workflowResult);
    if (!this.verbose && !this.trace)
      this.printDefault(workflowResult);
  }

  private printTrace(workflowResult: WorkflowResult) {
    console.log(JSON.stringify(workflowResult.result, null, 2));    
  }

  private printVerbose(workflowResult: WorkflowResult) {
    console.log(`!!!! ${workflowResult.workflow.name} : WorkFlow Result :!!!!`);
    console.log(workflowResult);
    console.log(`==== ${workflowResult.workflow.name} : Tests Result : ====`);
    console.log(workflowResult.result);
    console.log(`---- ${workflowResult.workflow.name} : Steps Result : ----`);
    workflowResult.result.tests.forEach(test => {
      console.log(test.steps)
    })
  }

  private printDefault(workflowResult: WorkflowResult) {
    console.log(workflowResult);
    // console.log('Test Result:', workflowResult.result.passed ? 'PASSED' : 'FAILED');
  }
}

/**
 * 例としての、テスト結果を表示するサンプルカスタムクラス
 * IResultReporterを実装したり、ResultReporterを継承したり活用してください。
 */
export class SampleCustomResultReporter extends ResultReporter {
  constructor(options: CommandOptions) {
    super(options);
  }
  reportResult(workflowResult: WorkflowResult): void {
    console.log('Custom Result:', workflowResult.result.passed ? 'All tests passed' : 'Some tests failed');
    super.reportResult(workflowResult);
  }
}
