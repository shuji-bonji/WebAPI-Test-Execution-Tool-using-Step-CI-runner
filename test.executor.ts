import * as path from 'path';
import { runFromFile, WorkflowOptions } from '@stepci/runner';
import { TestYaml } from './workflows';
import { commonEnvVar } from './test.env';
import { IResultReporter } from "./test.reporter";
import EventEmitter from 'events';

/** テストを実行するクラス */
export class TestExecutor {
  constructor(private defaultResultReporter: IResultReporter) { }
  
  async execute(testYamls: TestYaml[]) {
    let previousResult: WorkflowOptions | null = null;

    for (const testYaml of testYamls) {
      if (testYaml.wait)
        await new Promise(resolve => setTimeout(resolve, testYaml.wait));
      const filePath = path.resolve(__dirname, commonEnvVar.testWorkllowsDir, testYaml.fileName);
      // 確実にoptionsとその下のenvが初期化されていることを保証
      testYaml.options = testYaml.options || { env: {}};
      testYaml.options.env = testYaml.options.env || {};
      // 共通環境変数を追加
      Object.assign(testYaml.options.env, commonEnvVar);

      // ワークフロー間のチェーンニングを実現するため、前回の後処理で返されたオプションがある場合、テストワークフロー固有のオプションに反映する
      if (previousResult) 
        testYaml.options = this.mergeWorkflowOptions(previousResult, testYaml.options);
      try {
        const workflowResult = await runFromFile(filePath, testYaml.options);
        // 後処理が必要な場合に指定した処理を行い、ワークフロー間のチェーンニングを実現する必要があるなら、次のテストのためのオプションを保存
        previousResult = testYaml.workflowDataHandler
          ? testYaml.workflowDataHandler.execute(workflowResult)
          : null;
        // 結果を表示
        (testYaml.reporter || this.defaultResultReporter).reportResult(workflowResult);
      } catch (error) {
        console.error(`Error executing test for ${filePath}:`, error);
      }
    }
  }

  /** 必要なオプションをマージする */
  private mergeWorkflowOptions(from: WorkflowOptions, to: WorkflowOptions): WorkflowOptions {
    to.secrets = { ...to.secrets, ...from.secrets };
    if (from.ee && to.ee) {
      this.mergeEventEmitters(from.ee, to.ee);
    }
    to.env = { ...to.env, ...from.env };
    return to;
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
}
