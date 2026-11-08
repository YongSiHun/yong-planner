import Storage from 'expo-sqlite/kv-store';
import { useEffect, useState } from 'react';
import { report } from '../../../components/ui';

const GUIDE_HIDDEN_KEY = 'planner.guide.v1.hidden';

export function usePlannerGuide() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    let active = true;

    void Storage.getItem(GUIDE_HIDDEN_KEY)
      .then((hidden) => {
        if (!active) {
          return;
        }
        const isHidden = hidden === '1';

        setDontShowAgain(isHidden);
        setGuideOpen(!isHidden);
      })
      .catch(report);

    return () => {
      active = false;
    };
  }, []);

  function closeGuide() {
    setGuideOpen(false);
    void Storage.setItem(GUIDE_HIDDEN_KEY, dontShowAgain ? '1' : '0').catch(report);
  }

  return {
    guideOpen,
    dontShowAgain,
    setDontShowAgain,
    openGuide: () => setGuideOpen(true),
    closeGuide,
  };
}
