/// <reference types="react-scripts" />

declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}
