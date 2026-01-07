import { EntityState } from "@ngrx/entity";

export interface EventState {
  modal?: boolean;
  lastEventId?: string;
  items?: any;
  apyload?: {};
  additionalInfo?: string;
}

export const initialState: EventState = {
  items: { id: 0 },
};
