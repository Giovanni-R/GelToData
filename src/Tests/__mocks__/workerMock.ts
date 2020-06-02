import 'jsdom-worker'

export class MockWorker extends Worker {
  constructor() {
    super("../../Workers/processing.worker.ts");
    return this;
  }
}