import {
  AttachedCompletionStatusSchema,
  FinishReviewResultSchema,
  type AttachedCompletionStatus,
  type FinishReviewResult,
} from '../contracts/api.js';

export type AttachedCompletionOperation = () => Promise<FinishReviewResult>;

export class AttachedCompletionCoordinator {
  #status: AttachedCompletionStatus = AttachedCompletionStatusSchema.parse({ kind: 'waiting' });
  #inFlight: Promise<FinishReviewResult> | undefined;
  #terminal: FinishReviewResult | undefined;
  #resolveDelivery!: (result: FinishReviewResult) => void;
  #resolveResponseSettled!: () => void;

  readonly delivery: Promise<FinishReviewResult>;
  readonly responseSettled: Promise<void>;

  constructor() {
    const delivery = Promise.withResolvers<FinishReviewResult>();
    this.delivery = delivery.promise;
    this.#resolveDelivery = delivery.resolve;
    const responseSettled = Promise.withResolvers<void>();
    this.responseSettled = responseSettled.promise;
    this.#resolveResponseSettled = responseSettled.resolve;
  }

  markResponseSettled(): void {
    if (this.#status.kind === 'completed') this.#resolveResponseSettled();
  }


  status(): AttachedCompletionStatus {
    return this.#status;
  }

  async finish(expectedRevision: number, operation: AttachedCompletionOperation): Promise<FinishReviewResult> {
    if (this.#status.kind === 'completed') {
      return FinishReviewResultSchema.parse({ kind: 'alreadyCompleted', revision: this.#status.revision });
    }
    if (this.#terminal !== undefined) {
      return this.#terminal;
    }
    if (this.#inFlight !== undefined) {
      return this.#inFlight;
    }

    this.#status = AttachedCompletionStatusSchema.parse({ kind: 'finishing', expectedRevision });
    const attempt = (async () => {
      let result: FinishReviewResult;
      try {
        result = FinishReviewResultSchema.parse(await operation());
      } catch {
        result = FinishReviewResultSchema.parse({ kind: 'deliveryFailed' });
      }
      if (result.kind === 'completed') {
        this.#status = AttachedCompletionStatusSchema.parse({ kind: 'completed', revision: result.revision });
        this.#resolveDelivery(result);
      } else if (result.kind === 'deliveryFailed') {
        this.#terminal = result;
        this.#resolveDelivery(result);
      } else {
        this.#status = AttachedCompletionStatusSchema.parse({ kind: 'waiting' });
      }
      return result;
    })();
    this.#inFlight = attempt;
    try {
      return await attempt;
    } finally {
      if (this.#inFlight === attempt && this.#terminal === undefined && this.#status.kind !== 'finishing') {
        this.#inFlight = undefined;
      }
    }
  }
}

export function createAttachedCompletionCoordinator(): AttachedCompletionCoordinator {
  return new AttachedCompletionCoordinator();
}
