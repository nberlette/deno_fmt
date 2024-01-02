import { runner } from "./common.ts";

import ts from "./scenarios/typescript.ts";
import json from "./scenarios/json.ts";
import md from "./scenarios/markdown.ts";

runner.test({ ...json, options: { check: true } });
runner.test({ ...md, options: { check: true } });
runner.test({ ...ts, options: { check: true } });
