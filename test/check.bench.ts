import { runner } from "./common.ts";
import json from "./scenarios/json.ts";
import md from "./scenarios/markdown.ts";
import ts from "./scenarios/typescript.ts";

runner.bench({ ...json, options: { check: true } });
runner.bench({ ...md, options: { check: true } });
runner.bench({ ...ts, options: { check: true } });
