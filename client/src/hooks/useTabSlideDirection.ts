import { useEffect, useRef, useState } from 'react';

/** -1 = вкладка левее, 1 = правее, 0 = без горизонтального сдвига */
export const useTabSlideDirection = (currentTab: number | false): number => {
  const previousTabRef = useRef<number | false>(currentTab);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const previousTab = previousTabRef.current;

    if (
      typeof currentTab === 'number' &&
      typeof previousTab === 'number' &&
      currentTab !== previousTab
    ) {
      setDirection(currentTab > previousTab ? 1 : -1);
    } else {
      setDirection(0);
    }

    previousTabRef.current = currentTab;
  }, [currentTab]);

  return direction;
};
