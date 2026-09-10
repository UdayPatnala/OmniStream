/**
 * Playback State Machine - Centralized state machine for automated YouTube discovery & playback lifecycle.
 */

export type PlaybackState =
  | 'IDLE'
  | 'SEARCHING'
  | 'RESULTS_FOUND'
  | 'RANKING'
  | 'VALIDATING'
  | 'PLAYER_LOADING'
  | 'READY'
  | 'PLAYING'
  | 'BUFFERING'
  | 'RECOVERING'
  | 'ERROR';

export type StateListener = (state: PlaybackState, payload?: any) => void;

class PlaybackStateMachine {
  private currentState: PlaybackState = 'IDLE';
  private listeners: Set<StateListener> = new Set();
  private lastPayload: any = null;

  public getState(): PlaybackState {
    return this.currentState;
  }

  public getPayload(): any {
    return this.lastPayload;
  }

  public transition(newState: PlaybackState, payload?: any): void {
    if (this.currentState === newState && !payload) return;
    
    console.log(`[Playback State Machine] Transition: ${this.currentState} ➔ ${newState}`, payload || '');
    this.currentState = newState;
    this.lastPayload = payload;
    
    this.notify(newState, payload);
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState, this.lastPayload);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(state: PlaybackState, payload?: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(state, payload);
      } catch (e) {
        console.error('[Playback State Machine] Listener error:', e);
      }
    });
  }

  public reset(): void {
    this.transition('IDLE');
  }
}

export const playbackStateMachine = new PlaybackStateMachine();
