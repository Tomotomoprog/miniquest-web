import { useState, useEffect } from 'react';

// debounce（デバウンス）のためのカスタムフック
// valueが変更されてからdelayミリ秒後に、その最新の値を返す
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // delayミリ秒後に値を更新するタイマーを設定
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 次のeffectが実行される前、またはアンマウント時にタイマーをクリア
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // valueまたはdelayが変わった時だけ再設定

  return debouncedValue;
}