import EventEmitter from "events";

/** コマンドラインオプションを解析する */
export const parseCommandLineOptions = (args: string[]) => {
  return {
    verbose: args.includes('-v'),
    trace: args.includes('--trace')
  };
}

/** 指定した時間待機する */
export const delay = async (milliseconds: number | undefined): Promise<unknown> => 
  (milliseconds) && await new Promise(resolve => setTimeout(resolve, milliseconds));

/** 複数のEventEmitterからイベントリスナーをマージして新しいEventEmitterを返す関数 */
export const mergeEventEmitters = (ees: (EventEmitter | undefined)[]): EventEmitter => {
  const mergedEmitter = new EventEmitter();
  // 定義されているEventEmitterだけをフィルタリングして処理
  ees.filter(ee => ee instanceof EventEmitter).forEach(ee => {
    const events = ee.eventNames(); // eventNamesはイベント名の配列を返す
    events.forEach(event => {
      const listeners = ee.listeners(event) as ((...args: any[]) => void)[];
      listeners.forEach(listener => mergedEmitter.on(event as string | symbol, listener));
    });
  });
  return mergedEmitter;
}
