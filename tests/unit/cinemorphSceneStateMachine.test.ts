import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CineMorphSceneStateMachine,
  CineMorphSpace,
  EnvironmentalTime,
} from '@omnistream/cinemorph/spatial';

describe('CineMorph Viewport Scene State Machine (v1.09.09.0)', () => {
  let fsm: CineMorphSceneStateMachine;

  beforeEach(() => {
    fsm = new CineMorphSceneStateMachine('night');
  });

  describe('1. Initial State & Initialization Invariants', () => {
    it('initializes in arrival_lobby with valid spatial parameters and zero scroll invariants', () => {
      const state = fsm.getState();
      expect(state.currentSpace).toBe('arrival_lobby');
      expect(state.previousSpace).toBeNull();
      expect(state.transition).toBeNull();
      expect(state.environmentalTime).toBe('night');
      expect(state.canEnterTheater).toBe(false);
      expect(state.generation).toBeGreaterThanOrEqual(1);

      // Spatial camera parameters
      expect(state.parameters.depthZ).toBe(0);
      expect(state.parameters.focalBlurPx).toBe(0);
      expect(state.parameters.screenScale).toBe(1.0);
      expect(state.parameters.ambientIllumination).toBe(0.40);
      expect(state.parameters.ambientBackground).toBe('#070809');
      expect(state.parameters.accentTint).toBe('#E8A353');
    });

    it('correctly initializes in morning mode with Alabaster palette', () => {
      const morningFsm = new CineMorphSceneStateMachine('morning');
      const state = morningFsm.getState();
      expect(state.environmentalTime).toBe('morning');
      expect(state.parameters.ambientIllumination).toBe(0.88);
      expect(state.parameters.ambientBackground).toBe('#E8E2D7');
      expect(state.parameters.accentTint).toBe('#B58A52');
    });
  });

  describe('2. Dual Environmental States (Morning vs Night)', () => {
    it('switches environmental time via action and recomputes illumination parameters', () => {
      expect(fsm.getState().environmentalTime).toBe('night');
      expect(fsm.getState().parameters.ambientIllumination).toBe(0.40);

      const success = fsm.dispatch({ type: 'SET_ENVIRONMENTAL_TIME', time: 'morning' });
      expect(success).toBe(true);

      const state = fsm.getState();
      expect(state.environmentalTime).toBe('morning');
      expect(state.parameters.ambientIllumination).toBe(0.88);
      expect(state.parameters.ambientBackground).toBe('#E8E2D7');
    });

    it('preserves current space while switching environmental time', () => {
      fsm.dispatch({ type: 'START_INGEST' });
      expect(fsm.getState().currentSpace).toBe('media_ingest');

      fsm.dispatch({ type: 'SET_ENVIRONMENTAL_TIME', time: 'morning' });
      expect(fsm.getState().currentSpace).toBe('media_ingest');
      expect(fsm.getState().parameters.ambientIllumination).toBe(0.92);
    });
  });

  describe('3. Transition Graph Legality & Guard Invariants', () => {
    it('allows legal forward progression: lobby -> ingest -> printing -> decision -> theater', () => {
      // Step 1: Start Ingest
      expect(fsm.canTransition('media_ingest')).toBe(true);
      expect(fsm.dispatch({ type: 'START_INGEST' })).toBe(true);
      expect(fsm.getState().currentSpace).toBe('media_ingest');
      expect(fsm.getState().previousSpace).toBe('arrival_lobby');

      // Step 2: Start Printing
      expect(fsm.canTransition('ticket_printing')).toBe(true);
      expect(fsm.dispatch({ type: 'START_PRINTING', ticketId: 'tkt-test' })).toBe(true);
      expect(fsm.getState().currentSpace).toBe('ticket_printing');
      expect(fsm.getState().previousSpace).toBe('media_ingest');

      // Step 3: Finish Printing -> Admission Decision
      expect(fsm.dispatch({ type: 'FINISH_PRINTING' })).toBe(true);
      expect(fsm.getState().currentSpace).toBe('admission_decision');
      expect(fsm.getState().canEnterTheater).toBe(true);

      // Step 4: Confirm Admission -> Theater Entry
      expect(fsm.canTransition('theater_entry')).toBe(true);
      expect(fsm.dispatch({ type: 'CONFIRM_ADMISSION' })).toBe(true);
      expect(fsm.getState().currentSpace).toBe('theater_entry');
    });

    it('rejects illegal transitions that violate the spatial blueprint', () => {
      // Direct jump from lobby to theater_entry without ticket or admission is forbidden
      expect(fsm.canTransition('theater_entry')).toBe(false);
      expect(fsm.dispatch({ type: 'ENTER_SPACE', space: 'theater_entry' })).toBe(false);
      expect(fsm.getState().currentSpace).toBe('arrival_lobby');

      // Direct jump from lobby to admission_decision without ticket printing is forbidden
      expect(fsm.canTransition('admission_decision')).toBe(false);
      expect(fsm.dispatch({ type: 'ENTER_SPACE', space: 'admission_decision' })).toBe(false);
      expect(fsm.getState().currentSpace).toBe('arrival_lobby');
    });

    it('allows booking_office exploration and return to lobby', () => {
      expect(fsm.canTransition('booking_office')).toBe(true);
      expect(fsm.dispatch({ type: 'ENTER_SPACE', space: 'booking_office' })).toBe(true);
      expect(fsm.getState().currentSpace).toBe('booking_office');

      // Return to lobby
      expect(fsm.canTransition('arrival_lobby')).toBe(true);
      expect(fsm.dispatch({ type: 'RETURN_TO_LOBBY' })).toBe(true);
      expect(fsm.getState().currentSpace).toBe('arrival_lobby');
    });

    it('supports cancellation and return to lobby from printing or ingest', () => {
      fsm.dispatch({ type: 'START_INGEST' });
      expect(fsm.getState().currentSpace).toBe('media_ingest');

      fsm.dispatch({ type: 'CANCEL_PRINTING' });
      expect(fsm.getState().currentSpace).toBe('arrival_lobby');

      fsm.dispatch({ type: 'START_INGEST' });
      fsm.dispatch({ type: 'START_PRINTING', ticketId: 'test-cancel' });
      expect(fsm.getState().currentSpace).toBe('ticket_printing');

      fsm.dispatch({ type: 'CANCEL_PRINTING' });
      expect(fsm.getState().currentSpace).toBe('arrival_lobby');
    });
  });

  describe('4. Spatial Camera & Parameter Calculation Invariants', () => {
    const spaces: CineMorphSpace[] = [
      'arrival_lobby',
      'booking_office',
      'media_ingest',
      'ticket_printing',
      'admission_decision',
      'personal_screening_room',
      'theater_entry',
    ];

    it.each(spaces)('computes mathematically finite and non-NaN parameters for %s', (space) => {
      const nightParams = fsm.computeParameters(space, 'night');
      expect(Number.isFinite(nightParams.depthZ)).toBe(true);
      expect(Number.isFinite(nightParams.focalBlurPx)).toBe(true);
      expect(nightParams.focalBlurPx).toBeGreaterThanOrEqual(0);
      expect(nightParams.screenScale).toBeGreaterThan(0);
      expect(nightParams.ambientIllumination).toBeGreaterThanOrEqual(0);
      expect(nightParams.ambientIllumination).toBeLessThanOrEqual(1);

      const morningParams = fsm.computeParameters(space, 'morning');
      expect(Number.isFinite(morningParams.depthZ)).toBe(true);
      expect(morningParams.ambientIllumination).toBeGreaterThan(nightParams.ambientIllumination);
    });
  });

  describe('5. Observer Lifecycle & Subscriptions', () => {
    it('notifies subscribers upon space transition', () => {
      const listener = vi.fn();
      const unsubscribe = fsm.subscribe(listener);

      fsm.dispatch({ type: 'START_INGEST' });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        currentSpace: 'media_ingest',
      }));

      unsubscribe();
      fsm.dispatch({ type: 'CANCEL_PRINTING' });
      expect(listener).toHaveBeenCalledTimes(1); // Not called after unsubscribe
    });

    it('increments generation counter deterministically on each state mutation', () => {
      const initialGen = fsm.getState().generation;
      fsm.dispatch({ type: 'START_INGEST' });
      expect(fsm.getState().generation).toBe(initialGen + 1);

      fsm.dispatch({ type: 'SET_ENVIRONMENTAL_TIME', time: 'morning' });
      expect(fsm.getState().generation).toBe(initialGen + 2);
    });

    it('resets state cleanly to arrival_lobby', () => {
      fsm.dispatch({ type: 'START_INGEST' });
      fsm.dispatch({ type: 'START_PRINTING', ticketId: 'test-reset' });
      fsm.dispatch({ type: 'FINISH_PRINTING' });
      expect(fsm.getState().currentSpace).toBe('admission_decision');

      fsm.reset('night');
      expect(fsm.getState().currentSpace).toBe('arrival_lobby');
      expect(fsm.getState().canEnterTheater).toBe(false);
      expect(fsm.getState().previousSpace).toBeNull();
    });
  });
});
