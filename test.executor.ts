import * as path from 'path';
import { runFromFile, WorkflowOptions, WorkflowResult } from '@stepci/runner';
import { TestYaml } from './workflows';
import { commonEnvVar } from './test.env';
import { IResultReporter } from "./test.reporter";
import EventEmitter from 'events';

/** テストを実行するクラス */
export class TestExecutor {
  constructor(private defaultResultReporter: IResultReporter) {}

  async execute(testYamls: TestYaml[]) {
    let previousResult: WorkflowOptions | null = null;

    for (const testYaml of testYamls) {
      await this.delay(testYaml.wait);
      const filePath = path.resolve(__dirname, commonEnvVar.testWorkllowsDir, testYaml.fileName);
      const options = this.prepareOptions(testYaml.options, commonEnvVar, previousResult);

      try {
        const workflowResult = await runFromFile(filePath, options);
        previousResult = testYaml.workflowDataHandler?.execute(workflowResult) || null;
        this.reportResults(testYaml.reporter || this.defaultResultReporter, workflowResult);
      } catch (error) {
        console.error(`Error executing test for ${filePath}:`, error);
      }
    }
  }

  /** 指定した時間待機する */
  private async delay(milliseconds: number | undefined) {
    if (milliseconds) {
      await new Promise(resolve => setTimeout(resolve, milliseconds));
    }
  }

  /** 環境変数のマージとオプションのチェーンニング */
  private prepareOptions(options: WorkflowOptions | undefined, commonEnv: object, previousResult: WorkflowOptions | null): WorkflowOptions {
    const finalOptions = options || { env: {}};
    finalOptions.env = {...finalOptions.env, ...commonEnv};
    if (previousResult) 
      this.mergeOptions(previousResult, finalOptions);
    return finalOptions;
  }

  /** 必要なオプションをマージする */
  private mergeOptions(from: WorkflowOptions, to: WorkflowOptions) {
    to.secrets = { ...to.secrets, ...from.secrets };
    if (from.ee && to.ee)
      this.mergeEventEmitters(from.ee, to.ee);
    to.env = { ...to.env, ...from.env };
  }

  /** すべてのイベントをマージする */ 
  private mergeEventEmitters(sourceEmitter: EventEmitter, targetEmitter: EventEmitter): void {
    const eventNames = sourceEmitter.eventNames();
    eventNames.forEach((eventName: string | symbol) => {
      const listeners = sourceEmitter.listeners(eventName) as ((...args: any[]) => void)[];
      listeners.forEach((listener: (...args: any[]) => void) => {
        targetEmitter.on(eventName, listener);
      });
    });
  }

  /** 結果を表示 */
  private reportResults(reporter: IResultReporter, workflowResult: WorkflowResult) {
    reporter.reportResult(workflowResult);
  }
}