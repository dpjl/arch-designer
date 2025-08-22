import { useCallback, useEffect, useState } from 'react';

export function useStableInput(key: string, initial: string, onCommit: (value: string) => void) {
  const [value, setValue] = useState<string>(initial);

  // Reset local buffer when the keyed entity changes (e.g., selection changes)
  useEffect(() => {
    setValue(initial ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const commit = useCallback(() => {
    onCommit(value);
  }, [onCommit, value]);

  const handleBlur = useCallback(() => {
    commit();
  }, [commit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setValue(initial ?? '');
      (e.target as HTMLInputElement).blur();
    }
  }, [initial]);

  return { value, setValue, onChange: handleChange, onBlur: handleBlur, onKeyDown: handleKeyDown };
}
