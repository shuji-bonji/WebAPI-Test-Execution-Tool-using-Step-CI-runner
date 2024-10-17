import { WorkflowOptions } from '@stepci/runner';
import { CommandOptions, customResultReporterSample } from './test.reporter';
import { getLinkInApproverRequestEmail, getLinkInUserRegistEmail } from './test.result-handler';
import { parseCommandLineOptions } from './test.utils';
import { TestExecutor } from './test.executor'
import { commonEnvVar } from './test.env';

/** 実行するテストワークフローの設定値型 */
export type TestYaml = {
  fileName: string;          // テスト記述ファイル名
  wait?: number;             // ワークフロー実行するまでの待機時間
  options?: WorkflowOptions; // 実施するテスト固有のオプション[`WorkflowOptions`](https://github.com/stepci/runner/blob/515d095ed2f737f64a9df9f7a8ca3272afbc24f2/src/index.ts#L72)があるなら指定する。
  // テスト後処理が必要な場合に`IPostProcessing`を実装したクラスを指定する
  workflowDataHandler?: Function;
  reporter?: Function;       // オプションとして、カスタム表示関数を指定
};

const option: CommandOptions = parseCommandLineOptions(process.argv.slice(2));

export const testYamls: TestYaml[] = [
  // { fileName: 'auth.yml' },
  // { fileName: 'user.signup.yml' },
  // {
  //   fileName: 'mail.getSentMail.yml',
  //   wait: 15000,
  //   options: {
  //     env: {
  //       getmail_kind: 'to',
  //       getmail_query: 'user1@example.jp',
  //       getmail_start: '0',
  //       getmail_limit: '1'
  //     }
  //   },
  //   workflowDataHandler: getLinkInUserRegistEmail
  // },
  // { fileName: 'user.registration.yml' },
  // ここに新たなテストコードを追加してください。mail.getRegistrationMail
];

new TestExecutor(option, commonEnvVar).execute(testYamls);
