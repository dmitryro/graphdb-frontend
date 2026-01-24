export interface EventState {
  modal?: boolean;
  lastEventId?: string;
  /** * Fixed: Used Record<string, any> to allow property access (like .payload.theme)
   * while satisfying @typescript-eslint/no-explicit-any
   */
  items?: Record<string, any>;
  /** * Fixed: Replaced {} with Record<string, any> to satisfy
   * @typescript-eslint/no-empty-object-type
   */
  apyload?: Record<string, any>;
  additionalInfo?: string;
}

export const initialState: EventState = {
  items: { id: 0 },
};
