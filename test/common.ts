import fmt from "../mod.ts";
import { assertStrictEquals } from "./deps.ts";
import { smartAbbreviate } from "../src/helpers.ts";
import defaultOptions, { type Options } from "../src/options.ts";

interface BaseRecord {
  sync?: boolean | "both" | undefined;
  options?: Readonly<Partial<Options>> | undefined;
  name?: string;
  only?: boolean | undefined;
  ignore?: boolean | undefined;
  permissions?: Deno.PermissionOptions | undefined;
}

export interface Test extends BaseRecord {
  input: string;
  output?: string;
  expected?: string;
  baseline?: boolean | undefined;
  group?: string | undefined;
}

export interface TestDefinition extends BaseRecord {
  // deno-lint-ignore ban-types
  ext: Options["ext"] & {};
  options?: Readonly<Partial<Options>> | undefined;
  file?: string | undefined;
  scenarios: readonly Readonly<Test>[];
}

export function runner<B extends boolean = false>(
  bench?: B | undefined,
): <const T extends TestDefinition>(target: T) => void {
  return (target) => {
    const { scenarios, options: primaryOptions = {} } = target;

    let i = 1;
    for (let n = 0; n < scenarios.length; n++) {
      const scenario = scenarios[n];

      let { name, options: secondaryOptions = {} } = scenario;
      const options = {
        ...defaultOptions,
        ...secondaryOptions,
        ...primaryOptions,
      };

      const ext = (
        options as unknown as Record<string, unknown>
      ).ext = target.ext ?? options.ext;

      const {
        input,
        expected = undefined,
        output = expected === undefined ? input : expected,
        permissions,
        ignore = false,
        only = false,
        sync = "both",
      } = scenario;

      const both = sync === "both";
      const message =
        `Scenario #$n ($kind) failed for ext "$ext":\n\t($name): it should ${
          (name ??= "").replace(/^(it\s+)?should\s+/i, "")
        }\n\t\tInput: $input\n\t\tExpected: $expected\n\t\tActual: $actual\n\t\tOptions: $options\n\n`;

      const fnAsync = async () => {
        let source = input, expected: string | boolean = output;
        if (options.check) [source, expected] = [output, true];
        const actual = await fmt.format(source, { ...options });
        const errorMessage = message.replace(/\$kind/g, "async").replace(
          /\$actual/g,
          actual,
        ).replace(/\$input/g, JSON.stringify(input)).replace(
          /\$options/g,
          JSON.stringify(options),
        )
          .replace(
            /\$expected/g,
            JSON.stringify(expected),
          ).replace(
            /\$name/g,
            `${options.check ? "check" : "format"}${sync ? "Sync" : ""}`,
          )
          .replace(/\$ext/g, ext).replace(
            /\$n/g,
            String(n + 1),
          );

        if (!bench) assertStrictEquals(actual, expected, errorMessage);
      };

      const fnSync = () => {
        let source = input, expected: string | boolean = output;
        if (options.check) [source, expected] = [output, true];
        const actual = fmt.formatSync(source, { ...options });
        const errorMessage = message.replace(/\$kind/g, "async").replace(
          /\$actual/g,
          actual,
        ).replace(/\$input/g, JSON.stringify(input)).replace(
          /\$options/g,
          JSON.stringify(options),
        )
          .replace(
            /\$expected/g,
            JSON.stringify(expected),
          ).replace(
            /\$name/g,
            `${options.check ? "check" : "format"}${sync ? "Sync" : ""}`,
          )
          .replace(/\$ext/g, ext).replace(
            /\$n/g,
            String(n + 1),
          );

        if (!bench) assertStrictEquals(actual, expected, errorMessage);
      };

      const toRun = [] as (() => void | Promise<void>)[];
      if (both || sync === true) toRun.push(fnSync);
      if (both || sync === false) toRun.push(fnAsync);

      // only applicable to benchmarks
      const _name = smartAbbreviate(name ??= "", 60, "");

      for (const fn of toRun) {
        const kind = fn === fnSync ? "sync" : "async";
        const label = `[${
          [
            ext,
            `#${(String(n + 1)).padStart(2, "0")}`,
            options.check ? "check" : "fmt",
            kind,
          ].join(":")
        }]`;
        const name = `${label} ${_name}`;

        const definition = { name, only, ignore, permissions, fn };
        if (bench) {
          const baseline = scenario.baseline ?? false;
          const group = ["fmt", kind, ext, scenario.group].filter((v) =>
            v?.trim()
          ).join(":");
          Deno.bench({ ...definition, group, baseline });
        } else {
          Deno.test({ ...definition });
        }
        i++;
      }
    }
  };
}

runner.bench = runner(true);
runner.test = runner(false);
