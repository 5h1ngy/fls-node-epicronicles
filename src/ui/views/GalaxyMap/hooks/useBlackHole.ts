import { useEffect } from 'react';
import { createBlackHole } from '../lib/objects';
import { useGalaxyMapContext } from '../providers/GalaxyMapContext';

export const useBlackHole = () => {
  const {
    sceneContext,
    anchorState: { blackHoleRef },
  } = useGalaxyMapContext();

  useEffect(() => {
    const group = sceneContext?.systemGroup ?? null;
    if (!sceneContext || !group) {
      return;
    }
    const blackHole = createBlackHole();
    blackHoleRef.current = blackHole;
    group.add(blackHole);

    return () => {
      if (blackHoleRef.current && group) {
        group.remove(blackHoleRef.current);
      }
      blackHoleRef.current = null;
    };
  }, [sceneContext, blackHoleRef]);
};
