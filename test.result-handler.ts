import { StepResult, TestResult, WorkflowOptions, WorkflowResult } from '@stepci/runner';
import * as path from 'path';
import { commonEnvVar } from './test.env';
import { readFile } from 'fs';

export type PostParams = {
  [key: string]: any
}

export interface IWorkflowDataHandler {
  execute(workflowResult: WorkflowResult): WorkflowOptions | null;
}

/** メール内容取得  */
interface Mail {
  ID: string;
  From: MailUser;
  To: MailUser[];
  Content: MailContent;
  Created: string;
  MIME: string | null;
  Raw: RawMailData;
}

interface MailUser {
  Relays: null | string;
  Mailbox: string;
  Domain: string;
  Params: string;
}

interface MailContent {
  Headers: {
    [key: string]: string[];
  };
  Body: string;
  Size: number;
  MIME: string | null;
}

interface RawMailData {
  From: string;
  To: string[];
  Data: string;
  Helo: string;
}

type Params = {
  [key: string]: string;
};


export class GetLinkInEmail {
  // 直近のテスト及びステップを取得し、キャプチャしたメールを取得
  getCapturesEmail(workflowResult: WorkflowResult) {
    const lastTest = workflowResult.result.tests.at(-1)
    if (!lastTest)
      throw new Error("No workflow result could be obtained.");
    const lastStep = lastTest.steps.at(-1) || undefined;
    if (!lastStep?.captures)
      throw new Error("There was no captures in the result.");
    const mail: Mail = lastStep.captures.mail;
    return mail;
  }
  // Mailの本文を取得しBase64をデコードし取得する
  getDecodedBody(mail: Mail) {
    const body = mail.Content.Body
    const decodedBody = Buffer.from(body, 'base64').toString();
    return decodedBody;    
  }
  // herf属性の値を取得
  gethref(decodedBody: string, regexPattern: string) {
    const regex = new RegExp(regexPattern, "i");
    const match = decodedBody.match(regex);
    const href = match ? match[1] : 'URLが見つかりません';
    const url = new URL(href);
    return url;
  }
  // urlからクエリパラメータを取得
  getLinkParamsData(url: URL, keys: string[], prefix?: string): Params {
    const fixedKeys = [...keys] as const;
    type Key = typeof fixedKeys[number]
    type Obj = { [P in Key]: string | null };
    
    const params: Obj = keys.reduce((acc, key) => {
      const value = url.searchParams.get(key);
      if (value !== null) acc[key] = value;
      return acc;
    }, {} as Obj);
    
    // プレフィックスがあれば適用する
    const result: Params = {};
    for (const key in params) {
      if (params[key] !== null) {
        const newKey = prefix ? `${prefix}${key}` : key;
        result[newKey] = params[key];
      }
    }
    return result;
  }
}

/** 登録確認用メールのLinkよりパラメーターを取得するクラス */
export class GetLinkInUserRegistEmail extends GetLinkInEmail implements IWorkflowDataHandler {
  execute(workflowResult: WorkflowResult): WorkflowOptions | null {
    const regexPattern = `<a href="(http:\\/\\/${commonEnvVar.fontendHost}\\/register[^"]*)"`;
    const paramsKeys = ['id', 'code'];
    const prefix = 'registration_user_'

    const env = this.getQueryParameterValueFromEmail(workflowResult, regexPattern, paramsKeys, prefix);
    return {env};
  }
  /** メールより指定したパターンのhrefを取得し、そのURLより指定したクエリパラメータ値を取得する */
  private getQueryParameterValueFromEmail(workflowResult: WorkflowResult,regexPattern: string, paramsKeys: string[], prefix?: string ) {
    const mail: Mail = this.getCapturesEmail(workflowResult);
    const decodedBody = this.getDecodedBody(mail);
    const url = this.gethref(decodedBody, regexPattern);
    const env = this.getLinkParamsData(url, paramsKeys, prefix);
    return env;
  }
}
