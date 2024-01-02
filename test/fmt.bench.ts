import fmt from "../mod.ts";
import { assertEquals } from "./deps.ts";

const input = await Deno.readTextFile("./test/data/unformatted_1.ts");
const expected = await Deno.readTextFile("./test/data/formatted_1.ts");

Deno.bench({
  name: "format(string)",
  group: "fmt",
  baseline: true,
  async fn() {
    assertEquals(await fmt.format(input), expected);
  },
});

Deno.bench({
  name: "format(file)",
  group: "fmt",
  async fn() {
    const actual = await fmt.format`../test/data/unformatted_1.ts`;
    assertEquals(actual, expected);
  },
});

Deno.bench({
  name: "formatSync(string)",
  group: "fmt",
  fn() {
    assertEquals(fmt.formatSync(input), expected);
  },
});

Deno.bench({
  name: "formatSync(file)",
  group: "fmt",
  fn() {
    const actual = fmt.formatSync(import.meta.resolve("../test/data/unformatted_1.ts"));
    assertEquals(actual, expected);
  },
});
