export class SaveAbortedError extends Error {
  constructor(message = 'Save aborted') {
    super(message);
    this.name = 'SaveAbortedError';
  }
}

export const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw new SaveAbortedError();
  }
};

export const isSaveAborted = (error: unknown): boolean =>
  error instanceof SaveAbortedError ||
  (error instanceof DOMException && error.name === 'AbortError');
