# Step CI / runnerを利用したWebAPIテスト実行ツール
Step CI および stepci/runner を利用した、WebAPI実行ツールを作成しました。

特徴として、ワークフロー単位での、チェイニングすることも可能です。

## Step CI の導入

WebAPI 用テストツールとして `Step CI` を利用します。

以下を参照してください。

- https://stepci.com

`tests` ディレクトリ内にテストコードを準備します。

コード記述については以下ドキュメントを参照してください。  
（全て英語ですが ブラウザの翻訳機能を使うと、要素がきちんと作られたページなので、ストレスなしで読めます。）

- [ドキュメント](https://docs.stepci.com)

OpenAPI Scheram にも対応しています。

https://swagger.io/specification/


以下のコマンドにて、StepCIをインストールしてください。

```sh
npm install --save-dev stepci
```

### stepci/runner の導入

- https://github.com/stepci/runner

STEP CI では [Capture](https://docs.stepci.com/reference/workflow-syntax.html#tests-test-steps-step-http-captures)を利用することで、前のステップで得た結果を次のステップへ利用することが可能です。
ですかこれには限界があります。

例えば captureした`presignedURL`を利用して、フロントエンドからS3へアップロードする動作自体を再現することができません。
Shellにて、各yamlファイルを実行しても、この結果をShell側に引き渡すことができないのです。

これを解決するため、`stepci/runner` を導入しました。  
TypeScriptで実行結果を`Promise<WorkflowResult>`型で取得できるので、そこから、起動側へ受け渡すこと可能になります。
また、[stepci/runner](https://github.com/stepci/runner)を導入してますので以下もインストールしてください。

```sh
npm install --save-dev @stepci/runner
```
### ts-node の導入

- https://github.com/TypeStrong/ts-node

node.js上で、TypeScriptを実行するには、一旦 `tsc` コマンドでjavascriptにコンパイル（コンバート）する必要があり、その生成したJavaSrciptを実行する必要があります。
ワンステップで実行を行いたい為、今回は`ts-node`を導入します。

また、Node.jsに必要な型定義ファイルである`@types/node`も念の為導入します。

```sh
npm install --seve-dev @types/node
npm install --save-dev ts-node
```

> [!TIP]
> すでに`package.json`に組み込み済みなので、sign-api をclone時には以下のコマンドでインストールされます。
> ```sh
> npm install
> ```


## 環境変数の設定
テスト環境などの共通環境変数を`test.env.ts`で定義します。  
```ts
const HOST = "localhost:5000";
```
定数とし定義した環境変数は、`commonEnvVar`オブジェクトにプロパティとして追加します。
```ts
// 共通環境変数オブジェクト
export const commonEnvVar = {
  host: HOST, // 👈 追加した変数
  fontendHost: FRONTEND_HOST,
  baseurl: BASEURL,
  today: TODAY,
  now: NOW,
  expiredday: EXPIRED_DAY,
  basedir: BASE_DIR,
  testWorkllowsDir: TEST_WORKFLOWS_DIR,
  testResourcesDir: TEST_RESOURCES_DIR,
  STEPCI_DISABLE_ANALYTICS: "1"
};
```
これらは、`TestExecutor`が`import`し利用しており、各テストワークフローへ`env`としてそれぞれのプロパティが追加され、テストワークフロー(YAMLファイル定義)へ引き渡されます。。

```ts
Object.assign(testYaml.options.env, commonEnvVar);
```

テストワークフローであるYAMLファリルでは、以下のように定義した変数を利用します。
```yaml
host: ${{env.host}}
```

## テストシナリオについて
以下を参考に、テストシナリオをYAMLにてワークフロー単位で記載し追加してください。

- https://docs.stepci.com/guides/testing-http.html


> ![NOTE]
> Step CIには、OpenAPIに似た`$ref`構文をして、ワークフローに`test`または`step` 単位でインポートが可能です。ただし柔軟に利用するには少し不便です。
> https://docs.stepci.com/guides/organising-workflows.html

### テストシナリオ（テストワークフロー）の追加
[`worklows.ts`](./worklows.ts)の`testYamls`リストの部分の下に、必要であればパラメータやリポートクラスを指定し、追加してください。

```ts
export const testYamls: TestYaml[] = [
  // { fileName: 'auth.yml' },
  // {
  //   fileName: 'mail.getSentMail.yml',
  //   wait: 15000,
  //   options: { env: { toUserAccount: 'user1@example.jp' } },
  //   workflowDataHandler: getLinkInUserRegistEmail
  // },
  // { fileName: 'user.registration.yml',  reporter: customResultReporterSample },
  // ここに新たなテストコードを追加してください。mail.getRegistrationMail
  { fileName: 'auth.yml' },
];
```
単体で実行する場合など、他をコメントアウトするなど工夫をしてください。

TestYaml型の説明は以下通りです。


|プロパティ|型|説明|
|---|---|---|
|fileName|string|テストワークフローファイル名|
|wait?|number|ワークフロー実行するまでの待機時間|
|options?|WorkflowOptions|実施するテストワークフロー固有の [`WorkflowOptions`](https://github.com/stepci/runner/blob/515d095ed2f737f64a9df9f7a8ca3272afbc24f2/src/index.ts#L72)オプションがあるならここで指定する。|
|workflowDataHandler?|Function|オプションとして、テストワークフロー後の処理を記述します。結果から取得した値を元にAPI以外の処理を行い、その結果を次のテストワークフロー引き渡したりするなどの処理をここで行う。|
|reporter?|Function|オプションとして、カスタム表示を定義した関数を指定|

## HTTP API テストの実行

コードの準備ができ、ローカル開発環境の各コンテナ（`docker-compose up`）起動後に、以下のように `npm run` コマンドにて、StepCI を実行します。
```sh
npm run test:api
```

また、tests毎の詳細表示など行いたい場合は、以下を実行してください。

```sh
npm run test:api-v
```

デバックなどには、以下のようにより詳細にリクエスト・レスポンスを確認できます。

```sh
npm run test:api-t > hoge.txt
```
## 実行確認
stepci/runner は　`Promise<WorkflowResult>`型で結果が返ってきるので、この中の`result`オブジェクトを出力してレポーティングしてます。

以下の結果のように` passed: true,`にて、テストが成功していることを確認してください。

今後、表示結果などの整形する必要はあるかと思いますが、こちらは別途対応となります。

```ts
% npm run test:api  

> @0.0.1 test:api
> npx ts-node ./WebAPITest/workflow.ts

option false false
{
  workflow: {
    name: 'Authentication Tests',
    version: '1.0',
    env: null,
    tests: { user_authentication: [Object], token_lifecycle: [Object] }
  },
  result: {
    tests: [ [Object], [Object] ],
    timestamp: 2024-09-27T18:56:58.859Z,
    passed: true,
    duration: 197,
    co2: 0.00154056006,
    bytesSent: 0,
    bytesReceived: 0
  },
  path: '/Users/{userdir}/tests/auth.yml'
}
```

## npm スクリプト

`package.json`に登録した、npm スクリプトは以下となります。
```
    "test:api": "npx ts-node ./test.runner.ts",
    "test:api-v": "npx ts-node ./test.runner.ts -v",
    "test:api-t": "npx ts-node ./test.runner.ts --trace"
```

## Web API テストツールの構成


|ファイル名|説明|
|---|---|
|tests/*.yml|テストワークフローYAMLファイル<br>例: `auth.yml`|
|tests/*.*.yml|`$ref` 参照によって呼び出される yamlファイル<br>例: `auth.userAuthentication.yml`|
|test.env.ts|テスト実行時の環境変数を格納したファイル|
|workflow.ts|テスト実行するコアファイル。`npx npm run` にて呼び出される。<br>テストワークフローYAMLファイルのリスト情報`testYamls`を保持。このファイルのリストに定義したテストコードを追加する。|
|test.executor.ts|テスト実行クラス|
|test.reporter.ts|テスト結果をリポート表示する関数群|
|test.result-handler.ts|テスト実行後にテスト結果などを利用した、テスト以外の後処理など実行させるための関数群|
|utils.ts|コマンドオプションの判定ユーティリティ|
|tsconfig.json|typescript設定ファイル|


## テスト結果を利用した処理の追加
前のテストワークフロー結果から得た値を、次のテストワークフローに引き渡して実行する方法を想定して、`test.result-handler.ts`、テスト結果をハンドリングする関数を追加しました。

このような関数をテストワークフロー一覧(`testYamls`)に指定することで、単にワークフローチェインイングを目的とした、そのままチャプチャした値を`env`として返却するシンプルな使い方もあれば、テストワークフローの結果から得た値で、ストレージや他のAPIにアクセスし、その結果を返し次のワークフローに引き渡すような処理の記述も可能になります。。


#### 戻り値型:CapturesStorage
```ts
export declare type WorkflowOptions = {
    path?: string;
    secrets?: WorkflowOptionsSecrets;
    ee?: EventEmitter;
    env?: WorkflowEnv;
    concurrency?: number;
};
```

### 実装例
- getLinkInUserRegistEmail: 登録確認用メールのLinkよりパラメーターを取得する
- getLinkInApproverRequestEmail: 承認依頼メールのLinkよりパラメーターを取得する


```ts
/** 登録確認用メールのLinkよりパラメーターを取得する */
export const getLinkInUserRegistEmail = (workflowResult: WorkflowResult): WorkflowOptions | null => {
  const regexPattern = `<a href="(http:\\/\\/${commonEnvVar.frontendHost}\\/register[^"]*)"`;
  const prefix = 'registration_user_'
  const url = getLinkUrlFromMail(workflowResult, regexPattern);
  const env = getLinkParamsData(url, prefix);
  if (Object.keys(env).length === 0) return null;
  return { env };
}

/** 承認依頼メールのLinkよりパラメーターを取得する */
export const getLinkInApproverRequestEmail = (workflowResult: WorkflowResult): WorkflowOptions | null => {
  const regexPattern = `<a href="(http:\\/\\/${commonEnvVar.frontendHost}\\/documents\\/([0-9a-f-]+)\\/approve\\?token=([^"]+))"`;
  const prefix = 'approve_document_'
  const pathParamsName = 'id';
  const pathRegexPattern = `([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})`;
  const url = getLinkUrlFromMail(workflowResult, regexPattern);
  const params = getLinkParamsData(url, prefix);
  const pathParam = getLinkPathParamsData(url, pathRegexPattern, pathParamsName, prefix)
  const env = { ...params, ...pathParam };
  if (Object.keys(env).length === 0) return null;
  return { env };
}
```

### テストシナリオ（テストワークフロー）リストへの追加
```ts
options = {hoge: 'hoge'};
export const testYamls: TestYaml[] = [
  { fileName: "auth.yml", workflowDataHandler: getLinkInUserRegistEmail },
];
```

## テスト結果より、テスト以外の別処理を行う
以下のインターフェイスを実装し、テストシナリオ（テストワークフロー）リストの`testYamls`にて、`workflowDataHandler?`に、そのクラスを指定すれば、そのテスト結果を基に、テスト以外の処理を行なったり、`CapturesStorage`型で結果を返し、この結果を次のテストワークフローに引き渡して、チェーンニングを実現できます。

### IWorkflowDataHandler
```ts
export interface IWorkflowDataHandler {
  execute(workflowResult: WorkflowResult): WorkflowOptions | null;
}
```

#### 戻り値型:CapturesStorage
```ts
export declare type WorkflowOptions = {
    path?: string;
    secrets?: WorkflowOptionsSecrets;
    ee?: EventEmitter;
    env?: WorkflowEnv;
    concurrency?: number;
};
```

### IWorkflowDataHandlerの実装例
```ts
export class MailHogHook implements IWorkflowDataHandler{
  execute(workflowResult: WorkflowResult): WorkflowOptions | null {
    throw new Error("Method not implemented.");
    // MailHog APIを利用し、PostParamsにて指定したメールをフックし、指定した値をキャッチし返却する。
  }
}
```

### テストシナリオ（テストワークフロー）リストへの追加
```ts
options = {hoge: 'hoge'};
export const testYamls: TestYaml[] = [
  { fileName: "auth.yml", workflowDataHandler: new GetLinkInEmail() },
];
```

## テスト結果表示用の関数

デフォルトでは、`test.reporter.ts`に定義した、`resultReporter`関数が実行されます。

`test.reporter.ts`に、同じようにリポーター関数を定義し、`testYaml`にて、そのワークフローで指定することによって、ワークフロー固有の表示形式に変更することができます。


### テストシナリオ（テストワークフロー）リストへの追加
以下は、`customResultReporterSample`関数を`test.reporter.ts`に実装し、`worklows.ts`の`testYamls`に追加した例です。
```ts
options = {hoge: 'hoge'};
export const testYamls: TestYaml[] = [
  { fileName: "hoge.yml", reporter: customResultReporterSample },
];
```

実装例）ファイル出力、や結果のみ整形して通知など


## stepci/runner の応用利用

上記確認すると、[runFromFile(path: string, options?: WorkflowOptions)](https://github.com/stepci/runner/blob/515d095ed2f737f64a9df9f7a8ca3272afbc24f2/src/index.ts#L215)の [`WorkflowOptions`](https://github.com/stepci/runner/blob/515d095ed2f737f64a9df9f7a8ca3272afbc24f2/src/index.ts#L72)により、環境変数以外にシークレット情報や、イベントエミッターなどを設定できます。

[ReadMe.md](https://github.com/stepci/runner/blob/515d095ed2f737f64a9df9f7a8ca3272afbc24f2/README.md)でも、記載しているとおり`WorkflowOptions`の`ee`オプションに、EventEmitterを指定すれば、各イベントのフックやダミーイベントを作成することも可能のようです。

|イベント名|説明|
|---|---|
|step:http_request|HTTPリクエストが行われたときのイベント|
|step:http_response|HTTPレスポンスを受け取ったときのイベント|
|step:grpc_request|gRPCリクエストが行われたときのイベント|
|step:grpc_response|gRPCレスポンスを受け取ったときのイベント|
|step:result|ステップが完了したときのイベント|
|step:error|エラーが発生したときのイベント|
|test:result|テストが完了したときのイベント|
|workflow:result|ワークフローが完了したときのイベント|
|loadtest:result|ロードテストが完了したときのイベント|


### 利用例
以下のコードでは、HTTPリクエストが行われたときにリクエスト内容を表示するよう指定したサンプルです。

#### wrokflows.ts 
```ts
....
// EventEmitterのインスタンスを作成
const emitter = new EventEmitter();

// HTTPリクエストが行われたときのイベント
emitter.on('step:http_request', (request) => {
    console.log('HTTP Request Made:', request);
});

export const testYamls: TestYaml[] = [
  { fileName: "hoge.yml", options: { ee: emitter } },
  // ここに新たなテストコードを追加してください。
];
....
```
#### 実行結果
リクエスト時の内容を表示
```sh
....
},
  emit: [Function (anonymous)],
  [Symbol(shapeMode)]: false,
  [Symbol(kCapture)]: false,
  [Symbol(kBytesWritten)]: 0,
  [Symbol(kNeedDrain)]: false,
  [Symbol(corked)]: 0,
  [Symbol(kOutHeaders)]: [Object: null prototype] {
    'user-agent': [ 'user-agent', 'got (https://github.com/sindresorhus/got)' ],
    accept: [ 'accept', 'application/json' ],
    'content-type': [ 'content-type', 'application/json' ],
    authorization: [
      'authorization',
      'Bearer ....'
    ],
    'content-length': [ 'content-length', '1496' ],
    'accept-encoding': [ 'accept-encoding', 'gzip, deflate, br' ],
    host: [ 'Host', 'localhost:5000' ]
  },
  [Symbol(errored)]: null,
  [Symbol(kHighWaterMark)]: 16384,
  [Symbol(kRejectNonStandardBodyWrites)]: false,
  [Symbol(kUniqueHeaders)]: null,
  [Symbol(reentry)]: true
}
....

```
### 利用例（ダミーイベントを発生させる）
```ts
    emitter.emit('step:http_response', { statusCode: 200, body: 'OK' });
```
