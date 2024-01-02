import { Test } from "../common.ts";

export default {
  ext: "md",
  file: "test/data/markdown.ts",
  scenarios: <readonly Test[]> [{
    name: "should add a final newline at EOF",
    input: "# Title",
    output: "# Title\n",
    options: { ext: "md" },
  }, {
    name: "should remove leading and trailing whitespace",
    input: " \n\t# Title\n\t ",
    output: "    # Title\n",
    options: { ext: "md" },
  }, {
    name: "should remove extra new lines between paragraphs",
    input: "\n\n\n# Title\n\n\nParagraph",
    output: "# Title\n\nParagraph\n",
    options: { ext: "md" },
  }, {
    name: "should convert headings from setext to atx",
    input: "Title\n---\n\nSubtitle\n===\n\nParagraph\n",
    output: "# Title\n\n## Subtitle\n\nParagraph\n",
    options: { ext: "md" },
  }, {
    name: "should not modify content inside code blocks",
    input: "```javascript\n  const foo = 'bar';\n```",
    output: '```javascript\nconst foo = "bar";\n```\n',
    options: { ext: "md" },
  }, {
    name: "should not modify content inside inline code",
    input: "`const foo = 'bar';`",
    output: "`const foo = 'bar';`\n",
    options: { ext: "md" },
  }, {
    name: "should ensure consistent list indentation",
    input: "- Item 1\n    - Subitem\n- Item 2",
    output: "- Item 1\n  - Subitem\n- Item 2\n",
    options: { ext: "md" },
  }, {
    name: "should add proper spacing around list items",
    input: "-Item 1\n-Item 2",
    output: "-Item 1 -Item 2\n",
    options: { ext: "md" },
  }, {
    name: "should ensure consistent use of setext and atx headings",
    input: "# Title\nSubtitle\n---",
    output: "# Title\n\n## Subtitle\n",
    options: { ext: "md" },
  }, {
    name: "should ensure proper spacing between heading and content",
    input: "#   Title",
    output: "# Title\n",
    options: { ext: "md" },
  }, {
    name: "should respect block-level ignore comments",
    input: "<!-- deno-fmt-ignore -->\n \t  # Title\n",
    output: "<!-- deno-fmt-ignore -->\n \t  # Title\n",
    options: { ext: "md" },
  }, {
    name: "should respect file-level ignore comments",
    input: "<!-- deno-fmt-ignore-file -->\n \t #   Title\n",
    output: "<!-- deno-fmt-ignore-file -->\n \t #   Title\n",
    options: { ext: "md" },
  }, {
    name: "should ensure consistent list indentation (indentWidth: 2)",
    input: "- Item 1\n    - Subitem\n- Item 2",
    output: "- Item 1\n  - Subitem\n- Item 2\n",
    options: { ext: "md", indentWidth: 2 },
  }, {
    name: "should ensure consistent list indentation with tabs",
    input: " - Item 1\n   - Subitem\n - Item 2",
    output: "- Item 1\n  - Subitem\n- Item 2\n",
    options: { ext: "md", useTabs: true },
  }, {
    name: "should wrap prose to the specified lineWidth",
    input: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    output: "Lorem ipsum dolor sit amet, consectetur\nadipiscing elit.\n",
    options: { ext: "md", lineWidth: 40 },
  }, {
    name: "should preserve original line breaks with proseWrap: 'preserve'",
    input: "Line 1\nLine 2\nLine 3",
    output: "Line 1\nLine 2\nLine 3\n",
    options: { ext: "md", proseWrap: "preserve" },
  }, {
    name: "should always wrap prose with proseWrap: 'always'",
    input: "Line 1 Line 2 Line 3",
    output: "Line 1\nLine 2\nLine 3\n",
    options: { ext: "md", proseWrap: "always", lineWidth: 10 },
  }, {
    name: "should never wrap prose with proseWrap: 'never'",
    input: "Line 1 Line 2 Line 3",
    output: "Line 1 Line 2 Line 3\n",
    options: { ext: "md", proseWrap: "never" },
  }, {
    name: "should align table columns with left alignment",
    input:
      "| Name | Age | City |\n| --- | --- | --- |\n| John | 25 | New York |\n| Alice | 30 | Los Angeles |",
    output:
      "| Name  | Age | City        |\n| ----- | --- | ----------- |\n| John  | 25  | New York    |\n| Alice | 30  | Los Angeles |\n",
    options: { ext: "md" },
  }, {
    name: "should align table columns with different alignments",
    input: "| Left | Center | Right |\n| :--- | :---: | ---: |\n| L    | C      |   R  |",
    output: "| Left | Center | Right |\n| :--- | :----: | ----: |\n| L    |   C    |     R |\n",
    options: { ext: "md" },
  }, {
    name: "should align table columns with mixed content",
    input:
      "| Header1 | Header2     | Header3 |\n| :------ | ----------: | :-----: |\n| 1234    |    5678     |   90    |",
    output:
      "| Header1 | Header2 | Header3 |\n| :------ | ------: | :-----: |\n| 1234    |    5678 |   90    |\n",
    options: { ext: "md" },
  }, {
    name: "should align table columns when empty cells are present",
    input: "| Name | Age | City |\n| --- | --- | --- |\n| John |  | New York |\n| Alice | 30 |  |",
    output:
      "| Name  | Age | City     |\n| ----- | --- | -------- |\n| John  |     | New York |\n| Alice | 30  |          |\n",
    options: { ext: "md" },
  }],
} as const;
