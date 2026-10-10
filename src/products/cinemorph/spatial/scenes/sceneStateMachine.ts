/**
 * CineMorph Spatial Model — Viewport Scene State Machine
 * =======================================================
 * Pure, deterministic spatial state machine governing the 6 architectural spaces of CineMorph:
 * Arrival Lobby -> Booking Office -> Media Ingest -> Ticket Printing ->
 * Admission Decision -> Personal Screening Room -> Theater Entry
 * 
 * Invariants:
 * - Operates strictly within single 100dvh viewport without document scroll.
 * - Dynamic spatial parameters calculated per space and environmental time (Morning vs Night).
 * - Enforces legal transition graph with guard conditions.
 * - Decoupled observer subscriptions for render isolation.
 */

import {
  CineMorphSpace,
  EnvironmentalTime,
  SceneSpatialParameters,
  CineMorphSceneState,
  SceneAction,
} from './types';

// Legal transition adjacency list
const LEGAL_TRANSITIONS: Record<CineMorphSpace, readonly CineMorphSpace[]> = {
  arrival_lobby: ['booking_office', 'media_ingest', 'ticket_printing', 'personal_screening_room'],
  booking_office: ['arrival_lobby', 'admission_decision', 'personal_screening_room'],
  media_ingest: ['ticket_printing', 'arrival_lobby'],
  ticket_printing: ['admission_decision', 'arrival_lobby'],
  admission_decision: ['theater_entry', 'arrival_lobby', 'personal_screening_room'],
  personal_screening_room: ['theater_entry', 'arrival_lobby', 'booking_office'],
  theater_entry: ['arrival_lobby'],
};

export class CineMorphSceneStateMachine {
  private state: CineMorphSceneState;
  private listeners: Set<(state: CineMorphSceneState) => void> = new Set();

  constructor(initialTime?: EnvironmentalTime) {
    const time: EnvironmentalTime = initialTime || (this.detectSystemEnvironmentalTime());
    this.state = {
      currentSpace: 'arrival_lobby',
      previousSpace: null,
      environmentalTime: time,
      transition: null,
      parameters: this.computeParameters('arrival_lobby', time),
      canEnterTheater: false,
      generation: 1,
    };
  }

  private detectSystemEnvironmentalTime(): EnvironmentalTime {
    if (typeof window === 'undefined') return 'night';
    const hour = new Date().getHours();
    return hour >= 8 && hour < 18 ? 'morning' : 'night';
  }

  public getState(): CineMorphSceneState {
    return this.state;
  }

  public computeParameters(space: CineMorphSpace, time: EnvironmentalTime): SceneSpatialParameters {
    const isMorning = time === 'morning';
    const ambientBackground = isMorning ? '#E8E2D7' : '#070809';
    const accentTint = isMorning ? '#B58A52' : '#E8A353';

    switch (space) {
      case 'arrival_lobby':
        return {
          depthZ: 0,
          focalBlurPx: 0,
          ambientIllumination: isMorning ? 0.88 : 0.40,
          cameraPitchDeg: 0,
          screenScale: 1.0,
          ambientBackground,
          accentTint,
        };

      case 'booking_office':
        return {
          depthZ: -40,
          focalBlurPx: 1.5,
          ambientIllumination: isMorning ? 0.80 : 0.32,
          cameraPitchDeg: -1.2,
          screenScale: 0.95,
          ambientBackground: isMorning ? '#DFD8CC' : '#0B0D10',
          accentTint,
        };

      case 'media_ingest':
        return {
          depthZ: 60,
          focalBlurPx: 0,
          ambientIllumination: isMorning ? 0.92 : 0.48,
          cameraPitchDeg: 0.5,
          screenScale: 1.05,
          ambientBackground,
          accentTint,
        };

      case 'ticket_printing':
        return {
          depthZ: 30,
          focalBlurPx: 2.0,
          ambientIllumination: isMorning ? 0.75 : 0.28,
          cameraPitchDeg: -1.0,
          screenScale: 0.98,
          ambientBackground: isMorning ? '#E4DDD2' : '#0A0B0E',
          accentTint,
        };

      case 'admission_decision':
        return {
          depthZ: 15,
          focalBlurPx: 1.0,
          ambientIllumination: isMorning ? 0.82 : 0.35,
          cameraPitchDeg: -0.5,
          screenScale: 1.0,
          ambientBackground,
          accentTint,
        };

      case 'personal_screening_room':
        return {
          depthZ: 100,
          focalBlurPx: 0,
          ambientIllumination: isMorning ? 0.90 : 0.45,
          cameraPitchDeg: 1.0,
          screenScale: 1.08,
          ambientBackground: isMorning ? '#ECE6DC' : '#0E1014',
          accentTint,
        };

      case 'theater_entry':
        return {
          depthZ: 200,
          focalBlurPx: 0,
          ambientIllumination: isMorning ? 0.70 : 0.20,
          cameraPitchDeg: 0,
          screenScale: 1.15,
          ambientBackground: '#000000',
          accentTint,
        };
    }
  }

  public canTransition(targetSpace: CineMorphSpace): boolean {
    const allowed = LEGAL_TRANSITIONS[this.state.currentSpace];
    return allowed.includes(targetSpace);
  }

  public dispatch(action: SceneAction): boolean {
    const prev = this.state;

    switch (action.type) {
      case 'ENTER_SPACE': {
        if (!this.canTransition(action.space)) {
          return false;
        }
        this.transitionTo(action.space);
        return true;
      }

      case 'START_INGEST': {
        if (!this.canTransition('media_ingest')) {
          return false;
        }
        this.transitionTo('media_ingest');
        return true;
      }

      case 'START_PRINTING': {
        if (!this.canTransition('ticket_printing')) {
          return false;
        }
        this.transitionTo('ticket_printing');
        return true;
      }

      case 'FINISH_PRINTING': {
        if (this.state.currentSpace !== 'ticket_printing') {
          return false;
        }
        this.state = {
          ...this.state,
          canEnterTheater: true,
        };
        this.transitionTo('admission_decision');
        return true;
      }

      case 'CANCEL_PRINTING': {
        if (this.state.currentSpace === 'ticket_printing' || this.state.currentSpace === 'media_ingest') {
          this.transitionTo('arrival_lobby');
          return true;
        }
        return false;
      }

      case 'CONFIRM_ADMISSION': {
        if (this.state.currentSpace !== 'admission_decision' && this.state.currentSpace !== 'booking_office') {
          return false;
        }
        this.state = {
          ...this.state,
          canEnterTheater: true,
        };
        this.transitionTo('theater_entry');
        return true;
      }

      case 'ENTER_THEATER': {
        if (!this.state.canEnterTheater && this.state.currentSpace !== 'personal_screening_room') {
          return false;
        }
        if (!this.canTransition('theater_entry')) {
          return false;
        }
        this.transitionTo('theater_entry');
        return true;
      }

      case 'RETURN_TO_LOBBY': {
        this.transitionTo('arrival_lobby');
        return true;
      }

      case 'SET_ENVIRONMENTAL_TIME': {
        if (action.time === this.state.environmentalTime) return true;
        this.state = {
          ...this.state,
          environmentalTime: action.time,
          parameters: this.computeParameters(this.state.currentSpace, action.time),
          generation: this.state.generation + 1,
        };
        this.notify();
        return true;
      }
    }
  }

  private transitionTo(nextSpace: CineMorphSpace): void {
    const from = this.state.currentSpace;
    const now = Date.now();

    this.state = {
      ...this.state,
      currentSpace: nextSpace,
      previousSpace: from,
      transition: {
        from,
        to: nextSpace,
        progress: 1.0,
        isTransitioning: false,
        timestamp: now,
      },
      parameters: this.computeParameters(nextSpace, this.state.environmentalTime),
      generation: this.state.generation + 1,
    };

    this.notify();
  }

  public reset(time?: EnvironmentalTime): void {
    const envTime = time || this.detectSystemEnvironmentalTime();
    this.state = {
      currentSpace: 'arrival_lobby',
      previousSpace: null,
      environmentalTime: envTime,
      transition: null,
      parameters: this.computeParameters('arrival_lobby', envTime),
      canEnterTheater: false,
      generation: this.state.generation + 1,
    };
    this.notify();
  }

  public subscribe(listener: (state: CineMorphSceneState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentState = this.state;
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('[CineMorphSceneStateMachine] Notification error:', err);
      }
    });
  }
}

export const cineMorphSceneStateMachine = new CineMorphSceneStateMachine();
