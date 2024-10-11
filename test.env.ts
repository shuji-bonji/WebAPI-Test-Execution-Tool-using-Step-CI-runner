/**
 * テスト実施での共通となる環境変数を設定
 */ 
const HOST = "localhost:5000";
const FRONTEND_HOST = "localhost:4200"
const BASEURL = `http://${HOST}/api`;
const BASE_DIR = '';
const TEST_WORKFLOWS_DIR = 'tests';
const TEST_RESOURCES_DIR = 'resources';

// 動的に本日日付を取得（ドキュメント作成時に利用するため）
const TODAY = new Date().toISOString().split('T')[0].replace(/-/g, '/');
// 動的に現在日時を取得（ドキュメント作成時に利用するため）
const NOW = new Date().toISOString().split('T')[1].split('.')[0];
// 動的に有効期限日を取得（ドキュメント作成時に利用するため）
const EXPIRED_DAY = new Date(new Date()
  .setMonth(new Date().getMonth() + 1))
  .toISOString().split('T')[0].replace(/-/g, '/');

// 共通環境変数オブジェクト
export const commonEnvVar: {[key: string]: string} = {
  host: HOST,
  frontendHost: FRONTEND_HOST,
  baseurl: BASEURL,
  today: TODAY,
  now: NOW,
  expiredday: EXPIRED_DAY,
  basedir: BASE_DIR,
  testWorkllowsDir: TEST_WORKFLOWS_DIR,
  testResourcesDir: TEST_RESOURCES_DIR,
  STEPCI_DISABLE_ANALYTICS: "1"
};
