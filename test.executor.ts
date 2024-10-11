import * as path from 'path';
import { runFromFile, WorkflowOptions } from '@stepci/runner';
import { TestYaml } from './workflows';
import { CommandOptions, resultReporter } from "./test.reporter";
import { delay, mergeEventEmitters } from './test.utils';

/** テスト実行クラス  */
export class TestExecutor {
  constructor(
    private option: CommandOptions,
    private commonEnvVar: { [key: string]: string },
  ) { }

  async execute(testYamls: TestYaml[]) {
    let previousResult: WorkflowOptions | null = null;

    for (const testYaml of testYamls) {
      await delay(testYaml.wait);
      const filePath = path.resolve(__dirname, this.commonEnvVar.testWorkllowsDir, testYaml.fileName);
      const testOptions = this.prepareOptions(testYaml.options, this.commonEnvVar, previousResult);

      try {
        const workflowResult = await runFromFile(filePath, testOptions);

        previousResult = testYaml.workflowDataHandler?.(workflowResult) || null;
        // テストワークフロー固有の出力関数がある場合は指定関数を利用する。
        testYaml.reporter
          ? testYaml.reporter(this.option, workflowResult)
          : resultReporter(this.option, workflowResult);
      } catch (error) {
        console.error(`Error executing test for ${filePath}:`, error);
      }
    }
  }

  /** テストワークフロー実行オプションの準備 */
  private prepareOptions(options: WorkflowOptions | undefined,
    commonEnvVar: { [key: string]: string; },
    previousResult: WorkflowOptions | null): WorkflowOptions
  {
    const finalOptions = options ? { ...options } : { env: {} };
    // 共通環境変数の追加
    finalOptions.env = { ...finalOptions.env, ...commonEnvVar };
    // 前回のワークフロー結果から引き継ぐオプションがあった場合
    if (previousResult) {
      finalOptions.secrets = { ...finalOptions.secrets, ...previousResult.secrets };
      finalOptions.ee = mergeEventEmitters([finalOptions.ee, previousResult.ee]);
      finalOptions.env = {...finalOptions.env, ...previousResult.env}
    }
    return finalOptions;
  }
}
