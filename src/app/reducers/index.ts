import { isDevMode } from '@angular/core';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';

// Changed from interface to type alias to satisfy no-empty-interface
export type State = Record<string, never>;

export const reducers: ActionReducerMap<State> = {};

export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
