import { WorkflowOptions, WorkflowResult } from '@stepci/runner';
import { commonEnvVar } from './test.env';
import { lstat, readFile } from 'fs';

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
  protected getCapturesEmail(workflowResult: WorkflowResult) {
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
  protected getDecodedBody(mail: Mail) {
    return Buffer.from(mail.Content.Body, 'base64').toString();
  }
  // herf属性の値を取得
  protected getHref(decodedBody: string, regexPattern: string): URL {
    const regex = new RegExp(regexPattern, "i");
    const match = decodedBody.match(regex);
    if (!match || !match[1]) 
      throw new Error("No matching URL found in the email body.");
    return new URL(match[1]);
  }
  /** urlから、クエリパラメータを取得 */
  protected getLinkParamsDataWithKeys(url: URL, keys: string[], prefix?: string): Params {
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
  protected getLinkParamsData(url: URL, prefix?: string): Params {
    const params = Object.fromEntries(url.searchParams);
    if (!prefix) return params;
    // prefixがある場合、新しいキーを設定
    const modified = Object.keys(params).reduce((newObj, key) => {
      newObj[`${prefix}${key}`] = params[key];
      return newObj;
    }, {} as Params);
    return modified;
  }
  /** urlより、パスパラメータの値を取得 */
  protected getLinkPathParamsData(url: URL, pathRegexPattern: string, paramName: string, prefix?: string): Params {
    const regex = new RegExp(pathRegexPattern);
    const match = url.pathname.match(regex);
    if (!match) throw new Error("Path parameters did not match the pattern.");
    const params: Params = {}
    params[prefix ? `${prefix}${paramName}` : `${paramName}`] = match[0];
    return params;
  }
  /** Mail本文より、マッチしたHref属性（URL）を取得する */
  protected getLinkUrlFromMail(workflowResult: WorkflowResult,regexPattern: string )  {
    const mail: Mail = this.getCapturesEmail(workflowResult);
    const decodedBody = this.getDecodedBody(mail);
    return this.getHref(decodedBody, regexPattern);
  }
}

/** 登録確認用メールのLinkよりパラメーターを取得するクラス */
export class GetLinkInUserRegistEmail extends GetLinkInEmail implements IWorkflowDataHandler {
  execute(workflowResult: WorkflowResult): WorkflowOptions | null {
    const regexPattern = `<a href="(http:\\/\\/${commonEnvVar.frontendHost}\\/register[^"]*)"`;
    const prefix = 'registration_user_'
    const url = this.getLinkUrlFromMail(workflowResult, regexPattern);
    const env = this.getLinkParamsData(url, prefix);
    return {env};
  }
}
/** 承認依頼メールのLinkよりパラメーターを取得 */
export class GetLinkInApproverRequestEmail extends GetLinkInEmail implements IWorkflowDataHandler {
  execute(workflowResult: WorkflowResult): WorkflowOptions | null {
    const regexPattern = `<a href="(http:\\/\\/${commonEnvVar.frontendHost}\\/documents\\/([0-9a-f-]+)\\/approve\\?token=([^"]+))"`;
    const prefix = 'approve_document_'
    const pathParamsName = 'id';
    const pathRegexPattern = `([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})`;
    const url = this.getLinkUrlFromMail(workflowResult, regexPattern);
    const params = this.getLinkParamsData(url, prefix);
    const pathParam = this.getLinkPathParamsData(url, pathRegexPattern, pathParamsName, prefix)
    const env = { ...params, ...pathParam };
    return { env };
  }
}