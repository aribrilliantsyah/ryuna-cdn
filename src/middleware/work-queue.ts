type Resolver<T> = (err: Error | null, result?: T) => void

interface Job<T> {
  fn?: Promise<void>
  subscribers?: Resolver<T>[]
  queued?: () => void
}

export interface WorkQueueOptions {
  concurrency?: number
  multiplex?: <T>(v: T) => T
}

export class WorkQueue<T> {
  private jobs = new Map<string, Job<T>>()
  private waiting: Array<{ key: string; factory: () => Promise<T> }> = []
  private active = 0
  private concurrency: number
  private multiplex: (v: T) => T

  constructor(opts: WorkQueueOptions = {}) {
    this.concurrency = Math.max(1, opts.concurrency ?? Number.POSITIVE_INFINITY)
    this.multiplex = (opts.multiplex as (v: T) => T) ?? ((v) => v)
  }

  run(key: string, factory: () => Promise<T>): Promise<T> {
    if (!this.jobs.has(key)) {
      const job: Job<T> = {}
      this.jobs.set(key, job)

      if (this.active < this.concurrency) {
        this.start(key, factory)
      } else {
        this.waiting.push({ key, factory })
      }
    }
    return this.subscribe(key)
  }

  private start(key: string, factory: () => Promise<T>): void {
    this.active++
    const job = this.jobs.get(key)!
    job.fn = factory()
      .then((res) => this.complete(key, null, res))
      .catch((err) => this.complete(key, err as Error))
  }

  private subscribe(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const job = this.jobs.get(key)!
      job.subscribers ??= []
      job.subscribers.push((err, result) => (err ? reject(err) : resolve(result!)))
    })
  }

  private complete(key: string, err: Error | null, result?: T): void {
    const job = this.jobs.get(key)
    if (!job) return
    this.jobs.delete(key)
    this.active--
    for (const sub of job.subscribers ?? []) {
      if (err) sub(err)
      else sub(null, this.multiplex(result!))
    }

    const next = this.waiting.shift()
    if (next) this.start(next.key, next.factory)
  }

  stats(): { active: number; waiting: number; concurrency: number } {
    return { active: this.active, waiting: this.waiting.length, concurrency: this.concurrency }
  }
}
