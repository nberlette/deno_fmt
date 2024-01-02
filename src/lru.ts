// #region lru.ts
type Callback<
  T = unknown,
  A extends readonly unknown[] = [],
  R = void | PromiseLike<void>,
> = ((this: T, ...args: A) => R) extends infer V ? V : never;

type OnRemoveCallback<T = unknown> =
  | Callback<LRU<T>, [value: T, key: string, time: number], void>
  | Callback<LRU<T>, [value: T, key: string, time: number], PromiseLike<void>>;

type OnRefreshCallback<T = unknown> =
  | Callback<LRU<T>, [value: T, key: string, time: number], void>
  | Callback<LRU<T>, [value: T, key: string, time: number], PromiseLike<void>>;

type OnDisposeCallback<T = unknown> =
  | Callback<LRU<T>, [], void>
  | Callback<LRU<T>, [], PromiseLike<void>>;

type Entry<T> = readonly [value: T, time: number];

/**
 * turtll: tiny + fast implementation of an LRU with TTL and fixed capacity,
 * for Deno. Entries older than the TTL are evicted on a best-effort basis,
 * and the least recently used entry is evicted when the capacity is exceeded.
 *
 * Capacity and TTL (timeout, time-to-live) are both configurable at runtime by
 * passing an options object to the constructor, or by setting the `capacity`
 * and `timeout` properties, respectively. The default capacity is 100 entries,
 * and the default TTL is 30 seconds.
 *
 * Custom callbacks can be configured to run at various points in the cache's
 * lifecycle, including when entries are evicted, refreshed, or when the cache
 * itself is disposed. These callbacks are passed as options to the constructor,
 * or by setting the `onremove`, `onrefresh`, and `ondispose` properties,
 * respectively. The default callbacks are no-ops.
 *
 * > **Note**: The TTL is only checked when entries are accessed or added to
 * the cache, so it is possible to have entries that are older than the TTL.
 *
 * @template T The type of values stored in the cache.
 *
 * @module turtll - a smol ttl/lru cache mashup for Deno
 * @version 1.0.0
 * @license MIT
 * @author Nicholas Berlette <https://github.com/nberlette>
 */
export class LRU<T> {
  /**
   * Create a new LRU cache.
   * @param {Object} [init] The cache configuration.
   * @property {number} [init.capacity] The maximum number of entries to store.
   * @property {number} [init.timeout] The maximum time (in milliseconds) to store an entry.
   * @property {Callback<LRU<T>, [value: T, key?: string, time?: number]>} [init.onremove] Callback function invoked when an entry is evicted.
   * @property {Callback<LRU<T>, [value: T, key?: string, time?: number]>} [init.onrefresh] Callback function invoked when an entry is refreshed.
   * @property {Callback<LRU<T>>} [init.ondispose] Callback function invoked when the cache is disposed.
   * @throws {RangeError} If `capacity`/`timeout` are not positive finite integers.
   * @throws {TypeError} If `onremove`/`onrefresh` aren't callable or undefined.
   */
  constructor({
    capacity = 100,
    timeout = 30_000,
    onremove = () => {},
    onrefresh = () => {},
    ondispose = () => {},
  }: {
    capacity?: number;
    timeout?: number;
    onremove?: Callback<LRU<T>, [value: T, key?: string, time?: number]>;
    onrefresh?: Callback<LRU<T>, [value: T, key?: string, time?: number]>;
    ondispose?: Callback<LRU<T>>;
  } = {}) {
    this.capacity = capacity;
    this.timeout = timeout;
    this.onremove = onremove ?? (() => {});
    this.onrefresh = onrefresh ?? (() => {});
    this.ondispose = ondispose ?? (() => {});
  }

  /** The underlying map used to store entries. */
  #map = new Map<string, Entry<T>>();
  /** Time-to-live of entries in the map (in milliseconds). */
  #timeout = 30_000; // 30 seconds
  /** Maximum entries in the map at any given time. */
  #capacity = 100; // 100 entries
  /** Internal disposal state for explicit resource management. */
  #disposed = false;
  /** Callback function called when an entry is evicted. */
  #onremove: OnRemoveCallback<T> = () => {};
  /** Callback invoked when an entry is "refreshed", i.e. accessed or added. */
  #onrefresh: OnRefreshCallback<T> = () => {};
  /** Callback invoked when the cache is "disposed". */
  #ondispose: OnDisposeCallback<T> = () => {};

  #prune: () => this = () => {
    const now = Date.now();
    for (const [key, [, timestamp]] of this.#map) {
      if (
        (now - timestamp > this.timeout) ||
        (this.size >= this.capacity)
      ) {
        this.delete(key);
      }
    }
    return this;
  };

  /** Get the maximum number of entries the cache can hold. */
  get capacity(): number {
    return this.#capacity;
  }

  /** Set the maximum number of entries the cache can hold. */
  set capacity(capacity: number) {
    if (typeof capacity !== "number" || isNaN(capacity) || capacity < 0) {
      throw new RangeError("capacity must be a positive number");
    }

    this.#capacity = capacity;
    this.#prune();
  }

  /** Get the number of entries the cache can hold before it is full. */
  get vacancies(): number {
    return Math.max(0, this.capacity - this.size);
  }

  /** Get the TTL (in milliseconds) of entries in the cache. */
  get timeout(): number {
    return this.#timeout;
  }

  /** Set the TTL (in milliseconds) of entries in the cache. */
  set timeout(timeout: number) {
    if (
      typeof timeout !== "number" || isNaN(timeout) || timeout < 0 ||
      !Number.isInteger(timeout)
    ) {
      throw new RangeError("timeout must be a non-negative integer");
    }

    this.#timeout = timeout;
    this.#prune();
  }

  /** Get the number of entries in the cache. */
  get size(): number {
    return this.#map.size;
  }

  /** Check if an entry is in the cache. */
  has(key: string): boolean {
    return this.#map.has(key);
  }

  /**
   * Get an entry from the cache and mark it as recently used.
   * @param key The key of the entry to get.
   * @returns The entry value, or `undefined` if the key is not in the cache.
   */
  get(key: string): T | undefined {
    if (this.#disposed) throw new ReferenceError("Object has been disposed.");
    const entry = this.#map.get(key);
    if (entry) {
      const [value, timestamp] = entry ?? [];

      if (Date.now() - timestamp > this.timeout) {
        this.#map.delete(key);
        this.onremove?.(value, key, timestamp);
        return undefined;
      }

      this.#map.set(key, [value, Date.now()]);
      this.onrefresh?.(value, key, timestamp);
      return value;
    }
  }

  /**
   * Add an entry to the cache, evicting the least recently used entry if the
   * capacity has been exceeded.
   * @param key The key of the entry to add.
   * @param value The value of the entry to add.
   */
  set(key: string, value: T): this {
    if (this.#disposed) throw new ReferenceError("Object has been disposed.");
    if (this.capacity <= 0) return this;
    if (this.#map.size >= this.capacity) {
      const entry = this.#map.entries().next().value;
      if (entry && entry[0] && entry[1]) {
        const [key, val] = Array.from(entry) as [string, Entry<T>];
        const [value, timestamp] = val ?? [];

        this.#map.delete(key);
        this.onremove?.(value, key, timestamp);
      }
    }

    this.#map.set(key, [value, Date.now()]);
    return this;
  }

  /**
   * Remove an entry from the cache.
   * @param key The key of the entry to remove.
   */
  delete(key: string): boolean {
    if (this.#disposed) throw new ReferenceError("Object has been disposed.");
    const [value, timestamp] = this.#map.get(key) ?? [];
    this.onremove?.(value!, key, timestamp!);

    return this.#map.delete(key);
  }

  /** Clear all entries from the cache. */
  clear(): void {
    this.#map.clear();
  }

  /**
   * Invoke the callback function for each entry in the cache.
   * @param callbackfn The callback function to invoke.
   * @param [thisArg] The `this` binding for the callback function.
   */
  forEach(
    callbackfn: (value: T, key: string, cache: LRU<T>) => void,
    thisArg?: unknown,
  ): void {
    if (typeof callbackfn !== "function") {
      throw new TypeError("callbackfn must be a function");
    }
    for (const [key, [value]] of this.#map) {
      callbackfn.call(thisArg, value, key, this);
    }
  }

  /** Get an iterator over the entries in the cache. */
  *entries(): IterableIterator<[string, T]> {
    this.#prune();
    for (const [key, [value]] of this.#map) yield [key, value];
  }

  /** Get an iterator over the keys in the cache. */
  *keys(): IterableIterator<string> {
    for (const [key] of this.entries()) yield key;
  }

  /** Get an iterator over the values in the cache. */
  *values(): IterableIterator<T> {
    for (const [, value] of this.entries()) yield value;
  }

  /** Get an iterator over the entries in the cache. */
  *[Symbol.iterator](): IterableIterator<[string, T]> {
    yield* this.entries();
  }

  /** Get the callback function called when an entry is evicted. */
  get onremove(): OnRemoveCallback<T> {
    return this.#onremove;
  }

  /** Set the callback function called when an entry is evicted. */
  set onremove(onremove: OnRemoveCallback<T>) {
    if (typeof onremove !== "function") {
      throw new TypeError("onremove must be a function");
    }

    this.#onremove = onremove.bind(this);
  }

  /** Get the callback function called when an entry is refreshed. */
  get onrefresh(): OnRefreshCallback<T> {
    return this.#onrefresh;
  }

  /** Set the callback function called when an entry is refreshed. */
  set onrefresh(onrefresh: OnRefreshCallback<T>) {
    if (typeof onrefresh !== "function") {
      throw new TypeError("onrefresh must be a function");
    }

    this.#onrefresh = onrefresh.bind(this);
  }

  /** Get the callback function called when the cache is disposed. */
  get ondispose(): OnDisposeCallback<T> {
    return this.#ondispose;
  }

  /** Set the callback function called when the cache is disposed. */
  set ondispose(ondispose: OnDisposeCallback<T>) {
    if (typeof ondispose !== "function") {
      throw new TypeError("ondispose must be a function");
    }
    this.#ondispose = ondispose.bind(this);
  }

  /** Explicit Resource Management */
  [Symbol.dispose](): void {
    if (!this.#disposed) {
      this.#disposed = true;
      this.ondispose?.();
      this.clear();
    }
  }

  /** Explicit Resource Management */
  async [Symbol.asyncDispose](): Promise<void> {
    if (!this.#disposed) {
      await this.ondispose?.();
      this.clear();
      this.#disposed = true;
    }
  }

  [Symbol.for("nodejs.util.inspect.custom")](
    depth: number | null,
    // deno-lint-ignore no-explicit-any
    options: any,
    inspect: (value: unknown, options?: unknown) => string,
  ): string {
    options = {
      ...options ?? {},
      depth: depth === null ? null : (depth || options.depth) - 1,
      colors: options.colors ?? true,
      compact: 3,
      customInspect: false,
      getters: true,
      showHidden: options.showHidden ?? false,
      numericSeparators: true,
    };

    const { size, capacity, timeout, constructor: { name } } = this;
    const map = this.#map;
    const entries = options.showHidden ? [...map] : undefined;
    const target = {
      size,
      capacity,
      timeout,
      ...(options.showHidden ? { entries } : {}),
    };
    return `${name} ${inspect(target, options)}`;
  }
}
// #endregion lru.ts
