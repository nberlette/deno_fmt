import { Test } from "../common.ts";

export default {
  ext: "ts",
  file: "test/data/typescript.ts",
  scenarios: <readonly Test[]> [
    {
      name: "should add a final newline at EOF",
      input: `const foo = "bar";`,
      output: `const foo = "bar";\n`,
    },
    {
      name: "should not use semicolons when 'semiColons' is disabled",
      input: `const foo = "bar";`,
      output: `const foo = "bar"\n`,
      options: { semiColons: false },
    },
    {
      name: "should use single quotes when 'singleQuote' is enabled",
      input: `const foo = "bar";`,
      output: `const foo = 'bar';\n`,
      options: { singleQuote: true },
    },
    {
      name: "should use the default width of 2 when 'indentWidth' is not set",
      input: `class Foo {bar() {return "baz";}}`,
      output: `class Foo {\n  bar() {\n    return "baz";\n  }\n}\n`,
    },
    {
      name: "should use the correct width when 'indentWidth' is set",
      input: `class Foo {bar() {return "baz";}}`,
      output: `class Foo {\n    bar() {\n        return "baz";\n    }\n}\n`,
      options: { indentWidth: 4 },
    },
    {
      name: "should use tabs when 'useTabs' is enabled",
      input: `class Foo {bar() {return "baz";}}`,
      output: `class Foo {\n\tbar() {\n\t\treturn "baz";\n\t}\n}\n`,
      options: { useTabs: true },
    },
    {
      name: "should use tabs when both 'indentWidth' and 'useTabs' are set",
      input: `class Foo {bar() {return "baz";}}`,
      output: `class Foo {\n\tbar() {\n\t\treturn "baz";\n\t}\n}\n`,
      options: { indentWidth: 4, useTabs: true },
    },
    {
      name: "should remove trailing commas",
      input: `const obj = { foo: "bar", };`,
      output: `const obj = { foo: "bar" };\n`,
    },
    {
      name: "should remove leading and trailing whitespace",
      input: ` \n\tconst foo = "bar";\n\t `,
      output: `const foo = "bar";\n`,
    },
    {
      name: "should remove extra new lines",
      input: `\n\n\nconst foo = "bar";\n\n\n`,
      output: `const foo = "bar";\n`,
    },
    {
      name: "should respect block-level ignore comments",
      input: `\n// deno-fmt-ignore\n \t  const foo = 'bar'\n\n`,
      output: `// deno-fmt-ignore\nconst foo = 'bar'\n`,
    },
    {
      name: "should respect file-level ignore comments",
      input: `// deno-fmt-ignore-file\nconst foo = 'bar'\n`,
      output: `// deno-fmt-ignore-file\nconst foo = 'bar'\n`,
    },
  ],
} as const;
