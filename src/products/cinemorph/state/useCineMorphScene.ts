/**
 * CineMorph Spatial Model — useCineMorphScene Hook
 * =================================================
 * Subscribes React components to the deterministic CineMorphSceneStateMachine.
 * Allows components to observe current space, transition parameters, and dispatch spatial actions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  cineMorphSceneStateMachine,
  CineMorphSceneState,
  SceneAction,
  CineMorphSpace,
  EnvironmentalTime,
} from '../spatial/scenes';

export function useCineMorphScene() {
  const [sceneState, setSceneState] = useState<CineMorphSceneState>(() =>
    cineMorphSceneStateMachine.getState()
  );

  useEffect(() => {
    // Initial sync
    setSceneState(cineMorphSceneStateMachine.getState());

    // Subscribe to state machine updates
    const unsubscribe = cineMorphSceneStateMachine.subscribe((updated) => {
      setSceneState(updated);
    });

    return unsubscribe;
  }, []);

  const dispatch = useCallback((action: SceneAction) => {
    return cineMorphSceneStateMachine.dispatch(action);
  }, []);

  const navigateToSpace = useCallback((space: CineMorphSpace) => {
    return cineMorphSceneStateMachine.dispatch({ type: 'ENTER_SPACE', space });
  }, []);

  const setEnvironmentalTime = useCallback((time: EnvironmentalTime) => {
    return cineMorphSceneStateMachine.dispatch({ type: 'SET_ENVIRONMENTAL_TIME', time });
  }, []);

  const canTransitionTo = useCallback((space: CineMorphSpace) => {
    return cineMorphSceneStateMachine.canTransition(space);
  }, []);

  return {
    ...sceneState,
    dispatch,
    navigateToSpace,
    setEnvironmentalTime,
    canTransitionTo,
  };
}
