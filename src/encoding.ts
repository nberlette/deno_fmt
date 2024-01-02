export const decoder = new TextDecoder("utf-8", { fatal: true });

export const encoder = new TextEncoder();

export const decode = decoder.decode.bind(decoder);

/**
 * Returns the result of running UTF-8's encoder.
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/TextEncoder/encode)
 */
export const encode = encoder.encode.bind(encoder);

/**
 * Runs the UTF-8 encoder on source, stores the result of that operation into
 * destination, and returns the progress made as an object wherein read is the
 * number of converted code units of source and written is the number of bytes
 * modified in destination.
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/TextEncoder/encodeInto)
 */
export const encodeInto = encoder.encodeInto.bind(encoder);
