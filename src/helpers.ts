export function isSharedArrayBuffer(it: unknown): it is SharedArrayBuffer {
  try {
    const SharedArrayBufferPrototypeGetByteLength = Object
      .getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "byteLength")!
      .get!;
    SharedArrayBufferPrototypeGetByteLength.call(it);
    return true;
  } catch {
    return false;
  }
}

export function isArrayBuffer(it: unknown): it is ArrayBuffer {
  try {
    const ArrayBufferPrototypeGetByteLength = Object.getOwnPropertyDescriptor(
      ArrayBuffer.prototype,
      "byteLength",
    )!.get!;
    ArrayBufferPrototypeGetByteLength.call(it);
    return true;
  } catch {
    return false;
  }
}

export function isAnyArrayBuffer(
  it: unknown,
): it is ArrayBuffer | SharedArrayBuffer {
  return isArrayBuffer(it) || isSharedArrayBuffer(it);
}

// #region callsites.ts
/**
 * Simple callsites implementation inspired by the work of Sindre Sorhus.
 * This allows us to resolve the `cwd` option in relation to the **_caller_**
 * of the `fmt` function, rather than the `fmt` function itself. Otherwise,
 * we end up with the `cwd` being restricted to an origin of `https://deno.land`
 * or `https://gist.githubusercontent.com/`, for example.
 */
export function callsites() {
  const { prepareStackTrace = (_e, _s) => {} } = Error;
  try {
    Error.prepareStackTrace = (e, s) => (prepareStackTrace(e, s), s);
    const err = new Error() as Error & {
      stack: CallSite[];
      __callSiteEvals?: unknown[];
    };

    Error.captureStackTrace(err, callsites);

    const { stack, __callSiteEvals = [] } = err;

    return Object.defineProperties([...stack], {
      __callSiteEvals: { value: __callSiteEvals, enumerable: false },
    }) as unknown as CallSite[] & { __callSiteEvals: unknown[] };
  } finally {
    Error.prepareStackTrace = prepareStackTrace;
  }
}

type TEvaluatedCallSite = {
  [
    P in keyof CallSite as P extends `get${infer K}` ? Uncapitalize<K>
      : P extends "toString" ? never
      : P
  ]: CallSite[P] extends () => infer R ? R : CallSite[P];
};

declare global {
  /**
   * An object representing a call site, such as a function call, in V8.
   * @see https://v8.dev/docs/stack-trace-api#customizing-stack-traces
   */
  interface CallSite {
    /**
     * Returns the **value** of `this` - if it exists - as a string. Otherwise,
     * returns `undefined`.
     */
    getThis<T = unknown>(): T | undefined;

    /**
     * Returns the type of `this` as a string. This is the name of the function
     * stored in the `[[Constructor]]` field of `this`, if available. Otherwise
     * the object's `[[Class]]` internal property.
     */
    getTypeName(): string | null;

    /**
     * Returns the name of the script if this function was defined in a script.
     *
     * In the Deno runtime, this can be used to determine the `import.meta.url`
     * value of the end user's project, which is useful when authoring modules
     * that will be imported remotely.
     */
    getFileName(): string | null;

    /**
     * Returns a reference to the current function itself, if available, else it
     * returns `undefined`.
     */
    // deno-lint-ignore no-explicit-any
    getFunction<T extends (...args: any[]) => any>(): T | undefined;

    /**
     * Returns the name of the current function (typically its `name` property).
     * If the `name` property is not available, an attempt will be made to infer
     * a name from the function's context. If a name still can't be determined,
     * returns `null`.
     */
    getFunctionName(): string | null;

    /**
     * Returns the name of the property of `this` or one of its prototypes that
     * holds the current function.
     */
    getMethodName(): string | undefined;

    /**
     * Returns the line number of the callsite function, if it was defined in a
     * script. If the line number cannot be determined, returns `null`.
     */
    getLineNumber(): number | null;

    /**
     * Returns the column number of the callsite function, if it was defined in a
     * script. If the column number cannot be determined, returns `null`.
     */
    getColumnNumber(): number | null;

    /**
     * Get the line number of the function's enclosing callsite, if available.
     * Otherwise, returns `null`.
     */
    getEnclosingLineNumber(): number | null;

    /**
     * Get the column number of the function's enclosing callsite, if available.
     * Otherwise, returns `null`.
     */
    getEnclosingColumnNumber(): number | null;

    /**
     * Returns a string representing the location where `eval` was called if this
     * function was created using a call to `eval`. If it was not created with
     * `eval` or `new Function`, or it cannot be determined, returns `undefined`.
     *
     * @see {@linkcode CallSite.isEval} to check if a function was created using `eval` or `new Function`.
     */
    getEvalOrigin(): string | undefined;

    /**
     * Returns the first line of the function's body if this function was
     * defined in a script. If it cannot be determined, returns `null`.
     */
    getPosition(): number | null;

    /**
     * Determine the execution index from an asynchronous call site, if it was
     * invoked by an async call to `Promise.all()` or `Promise.any()`.
     *
     * Returns the numeric index of the Promise, when the call originates from
     * an invocation of `Promise.all` or `Promise.any`. Otherwise, returns `null`.
     *
     * @see {@link CallSite.isAsync} to check for _any_ async call.
     * @see {@link CallSite.isPromiseAll} to check for `Promise.all` calls.
     * @async
     */
    getPromiseIndex(): number | null;

    /**
     * Returns the hash of the script if this function was defined in an
     * embedded `data:` URI.
     */
    getScriptHash(): string | null;

    /**
     * If the call site function was defined in a script, returns the name of the
     * script itself. If the function was defined remotely or in a base64-encoded
     * data URI, this will attempt to return the source URL. If a value cannot be
     * determined, returns an empty string (`""`).
     *
     * @see {@link CallSite.getScriptHash} to get an encoded script hash.
     */
    getScriptNameOrSourceURL(): string;

    /**
     * Determine if a call is from an async function (including `Promise.all`
     * and `Promise.any`), using V8's shiny new zero-cost async-stack-trace API.
     *
     * Returns `true` if this is tracing an async call, otherwise `false`.
     *
     * @see {@link CallSite.isPromiseAll} to check for `Promise.all` calls.
     * @see {@link CallSite.getPromiseIndex} to get the index of the Promise call
     * @async
     */
    isAsync(): boolean;

    /**
     * Is the call from a class constructor or a "newable" function?
     *
     * Returns `true` if the call site originated with `new`, otherwise `false`.
     */
    isConstructor(): boolean;

    /**
     * Returns `true` if this call takes place in code defined by a call to
     * `eval`, or if it was constructed using `new Function(...)` syntax.
     * Otherwise, returns `false`.
     *
     * @see {@link CallSite.getEvalOrigin} to get the source location of an `eval` call.
     */
    isEval(): boolean;

    /**
     * Does this call originate from native V8 code? This resolves to `true` for
     * invocations of any built-in functions, such as `Array.prototype.push()`.
     *
     * Returns `true` if this call is in native V8 code.
     */
    isNative(): boolean;

    /**
     * Is this an async call to `Promise.all()`?
     *
     * Returns `true` if this is an asynchronous call to `Promise.all`. Returns
     * `false` for everything else, even if it **_is async_**, but **_is not_**
     * explicitly from `Promise.all()`.
     *
     * @see {@link CallSite.isAsync} to check for _any_ async call.
     * @see {@link CallSite.getPromiseIndex} to get the index of the Promise call
     * @async
     */
    isPromiseAll(): boolean;

    /**
     * Returns `true` if this is a top-level invocation; top-level means an
     * object is either a global object, or is invoked at the outermost layer of
     * a script or module (and not nested inside another function / block).
     */
    isToplevel(): boolean;

    /**
     * Serializes the call site into a string, suitable for a stack trace entry.
     *
     * The format of the serialized string is:
     * ```
     * [TypeName.]MethodName (FileName:LineNumber:ColumnNumber)
     * ```
     *
     * **Note**: While this can be used directly, it is primarily intended as a
     * helper for the `Error.prepareStackTrace` API.
     *
     * @example Object.foo (file:///Users/foo/bar.ts:1:1)
     */
    toString(): string;
  }

  namespace CallSite {
    // deno-lint-ignore no-empty-interface
    export interface Evaluated extends TEvaluatedCallSite {}
  }

  interface ErrorConstructor {
    /**
     * Create `.stack` property on a target object.
     */
    // deno-lint-ignore ban-types
    captureStackTrace(targetObject: object, constructor?: Function): void;
    /**
     * Optional override for formatting stack traces
     * @see https://v8.dev/docs/stack-trace-api#customizing-stack-traces
     */
    // @ts-ignore duplicate identifier, but it's in the spec
    prepareStackTrace?<T = unknown>(err: Error, stackTraces: CallSite[]): T;
    /**
     * Override the maximum number of stack trace entries.
     * @default 10
     */
    stackTraceLimit: number;
  }
}
// #endregion callsites.ts

// #region sleep.ts
const dreams = new Int32Array(new SharedArrayBuffer(4));

export function sleepSync(ms: number): void;
export function sleepSync<T, const A extends readonly unknown[], R>(
  ms: number,
  callback: (this: T, ...args: A) => R,
  ...args: A
): R;
export function sleepSync<A extends readonly unknown[], R>(
  ms: number,
  callback: (...args: A) => R,
  ...args: A
): R;
export function sleepSync(
  ms: number,
  cb?: (...args: unknown[]) => unknown,
  ...args: unknown[]
): unknown {
  const start = Date.now();
  while (
    Atomics.wait(dreams, 0, 0, ms - (Date.now() - start)) !== "timed-out"
  ); // spin
  return cb?.(...args);
}

export async function sleep(ms: number): Promise<void>;
export async function sleep<T, const A extends readonly unknown[], R>(
  ms: number,
  callback: (this: T, ...args: A) => R,
  ...args: A
): Promise<R>;
export async function sleep<A extends readonly unknown[], R>(
  ms: number,
  callback: (...args: A) => R,
  ...args: A
): Promise<R>;
export async function sleep(
  ms: number,
  cb?: (...args: unknown[]) => unknown,
  ...args: unknown[]
): Promise<unknown> {
  return await new Promise((resolve) => {
    setTimeout(() => resolve(cb?.(...args)), ms);
  });
}

export declare namespace sleep {
  export { sleepSync as sync };
}

// deno-lint-ignore no-namespace
export namespace sleep {
  sleep.sync = sleepSync;
}
// #endregion sleep.ts

// #region bind.ts
const $bind = Function.prototype.bind;

// Overriding global prototypes is generally considered bad practice, but in
// this case we're doing it to gain some awesome functionality: preserving
// the original function name and any static properties when binding a function
// or a class constructor. Just to be safe, we'll name the new method bindSafe.
export function bindSafe<
  T,
  const A extends readonly unknown[],
  const B extends readonly unknown[],
  R = unknown,
  // deno-lint-ignore no-explicit-any
  U extends Record<string | symbol, any> = Record<never, never>,
>(
  target: ((...args: [...A, ...B]) => R) & U,
  thisArg: T,
  ...args: A
): ((this: T, ...args: B) => R) & typeof target {
  const props = Object.getOwnPropertyDescriptors(target);
  const value = target.name;
  const fn = $bind.call(target, thisArg, ...args);
  const length = Math.max(target.length - args.length, 0);
  Object.defineProperties(fn, {
    name: { value, configurable: true },
    length: { value: length, configurable: true },
    toString: {
      value: function toString(this: typeof target) {
        let str = Function.prototype.toString.call(this);
        const check = () => str.includes("[native code]");
        if (check()) str = this.toString();
        if (check()) {
          str = `function ${this.name || "anonymous"}() { [native code] }`;
        }
        return str;
      }.bind(target),
    },
  });

  for (const key in props) {
    // skip the constructor and name properties
    if (key === "constructor" || key === "name") continue;
    const descriptor = props[key];
    const { value, get, set } = descriptor;
    if (value && typeof value === "function") {
      // bind static methods to the original thisArg
      // - note: this uses the new bind method, not the original, meaning it
      // may recursively bind any nested methods all the way down the chain
      descriptor.value = bindSafe(value, target);
    } else {
      // bind static getters/setters to the original thisArg
      // - note these use the original Function.prototype.bind since they don't
      // require any special logic here.
      if (get && typeof get === "function") {
        descriptor.get = $bind.call(get, target);
      }
      if (set && typeof set === "function") {
        descriptor.set = $bind.call(set, target);
      }
    }
    Object.defineProperty(fn, key, descriptor);
  }

  return fn;
}
// #endregion bind.ts

// #region Type Helpers

export type Exclusivity = "[]" | "(]" | "[)" | "()";

type RangeInclusive<
  Min extends number = number,
  Max extends number = number,
> = readonly [minInclusive: Min, maxInclusive: Max, exclusivity: "[]"];

type RangeInclusiveMin<
  Min extends number = number,
  Max extends number = number,
> = readonly [minInclusive: Min, maxExclusive: Max, exclusivity: "[)"];

type RangeInclusiveMax<
  Min extends number = number,
  Max extends number = number,
> = readonly [minExclusive: Min, maxInclusive: Max, exclusivity: "(]"];

type RangeExclusive<
  Min extends number = number,
  Max extends number = number,
> = readonly [minExclusive: Min, maxExclusive: Max, exclusivity: "()"];

type RangeUnknown<
  Min extends number = number,
  Max extends number = number,
  Tex extends Exclusivity = Exclusivity,
> = readonly [min: Min, max: Max, exclusivity?: Tex];

export type Range<
  Min extends number = number,
  Max extends number = number,
  Tex extends Exclusivity = never,
> = [Tex] extends [never] ?
    | RangeInclusive<Min, Max>
    | RangeInclusiveMin<Min, Max>
    | RangeInclusiveMax<Min, Max>
    | RangeExclusive<Min, Max>
    | RangeUnknown<Min, Max>
  : globalThis.Extract<
    Range<Min, Max, never>,
    Required<RangeUnknown<Min, Max, Tex>>
  >;

// #endregion Type Helpers

// #region Path Helpers
export function resolveRelativePath(path: string | URL, base?: string | URL) {
  const stack = callsites();
  //     ^---→ [ 0: getCallerFile, 1: caller ]
  const caller = stack.at(0)!;
  base ??= caller.getFileName() ?? Deno.cwd();
  return new URL(
    path.toString(),
    "file://" + base.toString().replace(/\/$/, "").replace(/^file:\/\//, "") +
      "/",
  );
}
// #endregion Path Helpers

// #region String Utilities
export function smartAbbreviate(str: string, limit = 80, suffix = " ...") {
  const words = str.split(/\s+/);
  const adjustedLimit = limit - suffix.length;
  let result = words.join(" ");
  if (result.length > limit) {
    result = words
      .slice(0, words.length - 1)
      .reduce((acc, word) => {
        if (acc.length + word.length + 1 > adjustedLimit) return acc;
        return `${acc ? acc + " " : ""}${word}`;
      }) + suffix;
  }

  return result;
}
// #endregion String Utilities

export function setFunctionName<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string,
): T {
  if (typeof fn !== "function") throw new TypeError("fn must be a function");
  if (!Reflect.defineProperty(fn, "name", { value: name })) {
    return { [name]: fn }[name] as T;
  } else {
    return fn;
  }
}
