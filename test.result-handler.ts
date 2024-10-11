import { WorkflowOptions, WorkflowResult } from '@stepci/runner';
import { commonEnvVar } from './test.env';

/** メール内容取得  */
type Mail = {
  ID: string;
  From: MailUser;
  To: MailUser[];
  Content: MailContent;
  Created: string;
  MIME: string | null;
  Raw: RawMailData;
}

type MailUser = {
  Relays: null | string;
  Mailbox: string;
  Domain: string;
  Params: string;
}

type MailContent = {
  Headers: {
    [key: string]: string[];
  };
  Body: string;
  Size: number;
  MIME: string | null;
}

type RawMailData = {
  From: string;
  To: string[];
  Data: string;
  Helo: string;
}

type Params = {
  [key: string]: string;
};

/** テスト結果から、キャプチャされたメールを取得する */
const getCapturesEmail = (workflowResult: WorkflowResult): Mail => {
  const lastTest = workflowResult.result.tests.at(-1)
  if (!lastTest)
    throw new Error("No workflow result could be obtained.");
  const lastStep = lastTest.steps.at(-1) || undefined;
  if (!lastStep?.captures)
    throw new Error("There was no captures in the result.");
  return lastStep.captures.mail;
}

/** Mailの本文を取得しBase64をデコードし取得する */
const getDecodedBody = (mail: Mail): string => 
  Buffer.from(mail.Content.Body, 'base64').toString();

/** 指定したパターンに当てはまる、リンクのherf属性の値を取得 */
const getHref = (decodedBody: string, regexPattern: string): URL => {
  const regex = new RegExp(regexPattern, "i");
  const match = decodedBody.match(regex);
  if (!match || !match[1]) 
    throw new Error("No matching URL found in the email body.");
  return new URL(match[1]);
}

/** urlから、クエリパラメータを取得 */
const getLinkParamsData = (url: URL, prefix?: string): Params => {
  const params = Object.fromEntries(url.searchParams);
  if (!prefix) return params;
  // prefixがある場合、prefixを接頭した新しいキーを設定
  const modified = Object.keys(params).reduce((newObj, key) => {
    newObj[`${prefix}${key}`] = params[key];
    return newObj;
  }, {} as Params);
  return modified;
}

/** urlより、パスパラメータの値を取得 */
const getLinkPathParamsData = (url: URL, pathRegexPattern: string, paramName: string, prefix?: string): Params => {
  const regex = new RegExp(pathRegexPattern);
  const match = url.pathname.match(regex);
  if (!match) throw new Error("Path parameters did not match the pattern.");
  const params: Params = {}
  params[prefix ? `${prefix}${paramName}` : `${paramName}`] = match[0];
  return params;
}

/** Mail本文より、マッチしたHref属性（URL）を取得する */
const getLinkUrlFromMail = (workflowResult: WorkflowResult, regexPattern: string ): URL => {
  const mail = getCapturesEmail(workflowResult);
  const decodedBody = getDecodedBody(mail);
  return getHref(decodedBody, regexPattern);
}

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
