import { assertStrictEquals } from "./deps.ts";
import fmt from "../mod.ts";

const { test } = Deno;

test("[baseline] fmt.format", () => {
  assertStrictEquals(typeof fmt.format, "function", "format should be a function");
  assertStrictEquals(fmt.format.name, "format", "format.name should be 'format'");
  assertStrictEquals(fmt.format.length, 1, "format.length should be 1");
  assertStrictEquals(
    fmt.format.constructor.name,
    "AsyncFunction",
    "format.constructor.name should be 'AsyncFunction'",
  );
});

test("[baseline] fmt.formatSync", () => {
  assertStrictEquals(typeof fmt.formatSync, "function", "formatSync should be a function");
  assertStrictEquals(fmt.formatSync.name, "formatSync", "formatSync.name should be 'formatSync'");
  assertStrictEquals(fmt.formatSync.length, 1, "formatSync.length should be 1");
  assertStrictEquals(
    fmt.formatSync.constructor.name,
    "Function",
    "formatSync.constructor.name should be 'Function'",
  );
});

test("[baseline] fmt.check", () => {
  assertStrictEquals(typeof fmt.check, "function", "check should be a function");
  assertStrictEquals(fmt.check.name, "check", "check.name should be 'check'");
  assertStrictEquals(fmt.check.length, 1, "check.length should be 1");
  assertStrictEquals(
    fmt.check.constructor.name,
    "AsyncFunction",
    "check.constructor.name should be 'AsyncFunction'",
  );
});

test("[baseline] fmt.checkSync", () => {
  assertStrictEquals(typeof fmt.checkSync, "function", "checkSync should be a function");
  assertStrictEquals(fmt.checkSync.name, "checkSync", "checkSync.name should be 'checkSync'");
  assertStrictEquals(fmt.checkSync.length, 1, "checkSync.length should be 1");
  assertStrictEquals(
    fmt.checkSync.constructor.name,
    "Function",
    "checkSync.constructor.name should be 'Function'",
  );
});
