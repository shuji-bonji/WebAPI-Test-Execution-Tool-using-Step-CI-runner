import { WorkflowOptions } from '@stepci/runner';
import { TestExecutor } from './test.executor';
import { CommandOptions, IResultReporter, ResultReporter, SampleCustomResultReporter } from './test.reporter';
import { parseCommandLineOptions } from './test.utils';
import { IWorkflowDataHandler } from './test.result-handler';

/** 実行するテストワークフローの設定値型 */
export type TestYaml = {
  fileName: string;           // テスト記述ファイル名
  wait?: number;              // ワークフロー実行するまでの待機時間
  options?: WorkflowOptions;  // 実施するテスト固有のオプション[`WorkflowOptions`](https://github.com/stepci/runner/blob/515d095ed2f737f64a9df9f7a8ca3272afbc24f2/src/index.ts#L72)があるなら指定する。
  workflowDataHandler?: IWorkflowDataHandler; // テスト後処理が必要な場合に`IPostProcessing`を実装したクラスを指定する
  reporter?: IResultReporter; // オプションとして、カスタム表示を定義したクラスを指定
};

const options: CommandOptions = parseCommandLineOptions(process.argv.slice(2));

export const testYamls: TestYaml[] = [
  // { fileName: 'auth.yml' },
  // {
  //   fileName: 'mail.getRegistrationMail.yml',
  //   wait: 15000,
  //   options: { env: { toUserAccount: 'user1@example.jp' } },
  //   workflowDataHandler: new GetLinkInUserRegistEmail()
  // },
  // { fileName: 'user.registration.yml' },
  // ここに新たなテストコードを追加してください。mail.getRegistrationMail
];

const defaultResultReporter = new ResultReporter(options);
const testExecutor = new TestExecutor(defaultResultReporter);
testExecutor.execute(testYamls);
