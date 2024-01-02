import { Test, TestDefinition } from "../common.ts";

export default <Readonly<TestDefinition>> ({
  ext: "json",
  file: "test/data/json.ts",
  scenarios: <readonly Test[]> [
    {
      name: "should add a final newline at EOF",
      input: `{ "foo": "bar" }`,
      output: `{ "foo": "bar" }\n`,
      options: { ext: "json" },
    },
    {
      name: "should add missing quotes to keys",
      input: "{ lock: true, nodeModulesDir: true }",
      output: `{ "lock": true, "nodeModulesDir": true }\n`,
      options: { ext: "json" },
    },
    {
      name: "should use default 'indentWidth' when 'indentWidth' is not set",
      input:
        `{"lock":true,"nodeModulesDir":true,"fmt":{"semiColons":true,"singleQuote":false,"indentWidth":2}}`,
      output:
        '{\n  "lock": true,\n  "nodeModulesDir": true,\n  "fmt": { "semiColons": true, "singleQuote": false, "indentWidth": 2 }\n}\n',
      options: { ext: "json" },
    },
    {
      name: "should remove trailing commas",
      input: `{"foo":true,"bar":false,}`,
      output: `{ "foo": true, "bar": false }\n`,
      options: { ext: "json" },
    },
    {
      name: "should remove leading and trailing whitespace",
      input: `  \n\t{\t"foo": "bar"\n\t}\n\t`,
      output: `{ "foo": "bar" }\n`,
      options: { ext: "json" },
    },
    {
      name: "should remove extra new lines",
      input: `\n\n\n{ "foo": "bar" }\n\n\n`,
      output: `{ "foo": "bar" }\n`,
      options: { ext: "json" },
    },
    {
      name: "should respect block-level ignore comments",
      input: '\n// deno-fmt-ignore\n{ \tfoo: "bar" }',
      output: '// deno-fmt-ignore\n{ \tfoo: "bar" }\n',
      options: { ext: "jsonc" },
    },
    {
      name: "should respect file-level ignore comments",
      input: '// deno-fmt-ignore-file\n{ \tfoo: "bar"\n\t}\n',
      output: '// deno-fmt-ignore-file\n{ \tfoo: "bar"\n\t}\n',
      options: { ext: "jsonc" },
    },
    {
      name: "should use double quotes when 'singleQuote' is enabled",
      input: `{"foo":true,"bar":false}`,
      output: `{ "foo": true, "bar": false }\n`,
      options: { ext: "json", singleQuote: false },
    },
    {
      name: "should use the default width of 2 when 'indentWidth' is not set",
      input:
        `{"foo":true,"bar":false,"baz":true,"qux":false,"another":1,"and":"another","ok":{"this":"is","getting":"ridiculous"}}`,
      output:
        `{\n  "foo": true,\n  "bar": false,\n  "baz": true,\n  "qux": false,\n  "another": 1,\n  "and": "another",\n  "ok": { "this": "is", "getting": "ridiculous" }\n}\n`,
      options: { ext: "json" },
    },
    {
      name: "should use the correct width when 'indentWidth' is set",
      input:
        `{"foo":true,"bar":false,"baz":true,"qux":false,"another":1,"and":"another","ok":{"this":"is","getting":"ridiculous"}}`,
      output:
        `{\n    "foo": true,\n    "bar": false,\n    "baz": true,\n    "qux": false,\n    "another": 1,\n    "and": "another",\n    "ok": { "this": "is", "getting": "ridiculous" }\n}\n`,
      options: { ext: "json", indentWidth: 4 },
    },
    {
      name: "should use tabs when 'useTabs' is enabled",
      input:
        `{"foo":true,"bar":false,"baz":true,"qux":false,"another":1,"and":"another","ok":{"this":"is","getting":"ridiculous"}}`,
      output:
        `{\n\t"foo": true,\n\t"bar": false,\n\t"baz": true,\n\t"qux": false,\n\t"another": 1,\n\t"and": "another",\n\t"ok": { "this": "is", "getting": "ridiculous" }\n}\n`,
      options: { ext: "json", useTabs: true },
    },
    {
      name: "should use tabs when both 'indentWidth' and 'useTabs' are set",
      input:
        `{"foo":true,"bar":false,"baz":true,"qux":false,"another":1,"and":"another","ok":{"this":"is","getting":"ridiculous"}}`,
      output:
        `{\n\t"foo": true,\n\t"bar": false,\n\t"baz": true,\n\t"qux": false,\n\t"another": 1,\n\t"and": "another",\n\t"ok": { "this": "is", "getting": "ridiculous" }\n}\n`,
      options: { ext: "json", indentWidth: 4, useTabs: true },
    },
  ],
});
