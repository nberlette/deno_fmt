import { decode, encode, isAnyArrayBuffer } from "./helpers.ts";

const UPDATE_PLUGINS_SCRIPT = import.meta.resolve("./update-plugins.ts")
  .replace(/^file\:\/\//, "");

// Source: https://github.com/dprint/js-formatter/blob/main/mod.ts
export const config = {
  "$schema": "https://dprint.dev/schemas/v0.json",
  "indentWidth": 2,
  "lineWidth": 80,
  "newLineKind": "lf",
  "useTabs": false,
  "global": {
    "indentWidth": 2,
    "lineWidth": 80,
    "newLineKind": "lf",
    "useTabs": false,
  },
  "json": {
    "$schema":
      "https://plugins.dprint.dev/dprint/dprint-plugin-json/0.17.4/schema.json",
    "deno": true,
    "commentLine.forceSpaceAfterSlashes": true,
    "ignoreNodeCommentText": "deno-fmt-ignore",
    "array.preferSingleLine": true,
    "object.preferSingleLine": true,
  },
  "markdown": {
    "$schema":
      "https://plugins.dprint.dev/dprint/dprint-plugin-markdown/0.16.0/schema.json",
    "deno": true,
    "textWrap": "always",
    "emphasisKind": "underscores",
    "strongKind": "asterisks",
    "ignoreDirective": "deno-fmt-ignore",
    "ignoreFileDirective": "deno-fmt-ignore-file",
    "ignoreStartDirective": "deno-fmt-ignore-start",
    "ignoreEndDirective": "deno-fmt-ignore-end",
  },
  "typescript": {
    "$schema":
      "https://plugins.dprint.dev/dprint/dprint-plugin-typescript/0.88.1/schema.json",
    "deno": true,
    "quoteStyle": "preferDouble",
    "quoteProps": "consistent",
    "semiColons": "prefer",
    "ignoreNodeCommentText": "deno-fmt-ignore",
    "ignoreFileCommentText": "deno-fmt-ignore-file",
    "arrowFunction.useParentheses": "force",
    "binaryExpression.linePerExpression": false,
    "conditionalExpression.linePerExpression": true,
    "jsx.quoteStyle": "preferDouble",
    "jsx.multiLineParens": "prefer",
    "jsx.forceNewLinesSurroundingContent": false,
    "jsxOpeningElement.bracketPosition": "nextLine",
    "jsxSelfClosingElement.bracketPosition": "nextLine",
    "memberExpression.linePerExpression": false,
    "typeLiteral.separatorKind.singleLine": "semiColon",
    "typeLiteral.separatorKind.multiLine": "semiColon",
    "module.sortImportDeclarations": "maintain",
    "module.sortExportDeclarations": "maintain",
    "importDeclaration.sortNamedImports": "caseInsensitive",
    "exportDeclaration.sortNamedExports": "caseInsensitive",
    "arrowFunction.bracePosition": "sameLine",
    "classDeclaration.bracePosition": "sameLine",
    "classExpression.bracePosition": "sameLine",
    "constructor.bracePosition": "sameLine",
    "doWhileStatement.bracePosition": "sameLine",
    "enumDeclaration.bracePosition": "sameLine",
    "getAccessor.bracePosition": "sameLine",
    "ifStatement.bracePosition": "sameLine",
    "interfaceDeclaration.bracePosition": "sameLine",
    "forStatement.bracePosition": "sameLine",
    "forInStatement.bracePosition": "sameLine",
    "forOfStatement.bracePosition": "sameLine",
    "functionDeclaration.bracePosition": "sameLine",
    "functionExpression.bracePosition": "sameLine",
    "method.bracePosition": "sameLine",
    "moduleDeclaration.bracePosition": "sameLine",
    "setAccessor.bracePosition": "sameLine",
    "staticBlock.bracePosition": "sameLine",
    "switchCase.bracePosition": "sameLine",
    "switchStatement.bracePosition": "sameLine",
    "tryStatement.bracePosition": "sameLine",
    "whileStatement.bracePosition": "sameLine",
    "arguments.preferHanging": "never",
    "arrayExpression.preferHanging": "never",
    "arrayPattern.preferHanging": false,
    "doWhileStatement.preferHanging": false,
    "exportDeclaration.preferHanging": false,
    "extendsClause.preferHanging": false,
    "forStatement.preferHanging": false,
    "forInStatement.preferHanging": false,
    "forOfStatement.preferHanging": false,
    "ifStatement.preferHanging": false,
    "implementsClause.preferHanging": false,
    "importDeclaration.preferHanging": false,
    "jsxAttributes.preferHanging": false,
    "objectExpression.preferHanging": false,
    "objectPattern.preferHanging": false,
    "parameters.preferHanging": "never",
    "sequenceExpression.preferHanging": false,
    "switchStatement.preferHanging": false,
    "tupleType.preferHanging": "never",
    "typeLiteral.preferHanging": false,
    "typeParameters.preferHanging": "never",
    "unionAndIntersectionType.preferHanging": false,
    "variableStatement.preferHanging": false,
    "whileStatement.preferHanging": false,
    "enumDeclaration.memberSpacing": "maintain",
    "ifStatement.nextControlFlowPosition": "sameLine",
    "tryStatement.nextControlFlowPosition": "sameLine",
    "doWhileStatement.nextControlFlowPosition": "sameLine",
    "binaryExpression.operatorPosition": "sameLine",
    "conditionalExpression.operatorPosition": "nextLine",
    "conditionalType.operatorPosition": "nextLine",
    "ifStatement.singleBodyPosition": "maintain",
    "forStatement.singleBsodyPosition": "maintain",
    "forInStatement.singleBodyPosition": "maintain",
    "forOfStatement.singleBodyPosition": "maintain",
    "whileStatement.singleBodyPosition": "maintain",
    "arguments.trailingCommas": "onlyMultiLine",
    "parameters.trailingCommas": "onlyMultiLine",
    "arrayExpression.trailingCommas": "onlyMultiLine",
    "arrayPattern.trailingCommas": "onlyMultiLine",
    "enumDeclaration.trailingCommas": "onlyMultiLine",
    "exportDeclaration.trailingCommas": "onlyMultiLine",
    "importDeclaration.trailingCommas": "onlyMultiLine",
    "objectPattern.trailingCommas": "onlyMultiLine",
    "objectExpression.trailingCommas": "onlyMultiLine",
    "tupleType.trailingCommas": "onlyMultiLine",
    "typeLiteral.trailingCommas": "onlyMultiLine",
    "typeParameters.trailingCommas": "onlyMultiLine",
    "ifStatement.useBraces": "whenNotSingleLine",
    "forStatement.useBraces": "whenNotSingleLine",
    "forOfStatement.useBraces": "whenNotSingleLine",
    "forInStatement.useBraces": "whenNotSingleLine",
    "whileStatement.useBraces": "whenNotSingleLine",
    "arrayExpression.preferSingleLine": true,
    "arrayPattern.preferSingleLine": true,
    "arguments.preferSingleLine": true,
    "binaryExpression.preferSingleLine": false,
    "computed.preferSingleLine": true,
    "conditionalExpression.preferSingleLine": true,
    "conditionalType.preferSingleLine": true,
    "decorators.preferSingleLine": true,
    "exportDeclaration.preferSingleLine": true,
    "forStatement.preferSingleLine": true,
    "importDeclaration.preferSingleLine": true,
    "jsxAttributes.preferSingleLine": false,
    "jsxElement.preferSingleLine": false,
    "mappedType.preferSingleLine": false,
    "memberExpression.preferSingleLine": false,
    "objectExpression.preferSingleLine": true,
    "objectPattern.preferSingleLine": false,
    "parameters.preferSingleLine": true,
    "parentheses.preferSingleLine": false,
    "tupleType.preferSingleLine": true,
    "typeLiteral.preferSingleLine": false,
    "typeParameters.preferSingleLine": true,
    "unionAndIntersectionType.preferSingleLine": true,
    "variableStatement.preferSingleLine": false,
    "importDeclaration.forceSingleLine": false,
    "exportDeclaration.forceSingleLine": false,
    "exportDeclaration.forceMultiLine": false,
    "importDeclaration.forceMultiLine": false,
    "binaryExpression.spaceSurroundingBitwiseAndArithmeticOperator": true,
    "commentLine.forceSpaceAfterSlashes": true,
    "constructSignature.spaceAfterNewKeyword": true,
    "constructor.spaceBeforeParentheses": false,
    "constructorType.spaceAfterNewKeyword": true,
    "doWhileStatement.spaceAfterWhileKeyword": true,
    "exportDeclaration.spaceSurroundingNamedExports": true,
    "forStatement.spaceAfterForKeyword": true,
    "forStatement.spaceAfterSemiColons": true,
    "forInStatement.spaceAfterForKeyword": true,
    "forOfStatement.spaceAfterForKeyword": true,
    "functionDeclaration.spaceBeforeParentheses": false,
    "functionExpression.spaceBeforeParentheses": false,
    "functionExpression.spaceAfterFunctionKeyword": true,
    "getAccessor.spaceBeforeParentheses": false,
    "ifStatement.spaceAfterIfKeyword": true,
    "importDeclaration.spaceSurroundingNamedImports": true,
    "jsxExpressionContainer.spaceSurroundingExpression": false,
    "jsxSelfClosingElement.spaceBeforeSlash": true,
    "method.spaceBeforeParentheses": false,
    "objectExpression.spaceSurroundingProperties": true,
    "objectPattern.spaceSurroundingProperties": true,
    "setAccessor.spaceBeforeParentheses": false,
    "spaceSurroundingProperties": true,
    "taggedTemplate.spaceBeforeLiteral": false,
    "typeAnnotation.spaceBeforeColon": false,
    "typeAssertion.spaceBeforeExpression": true,
    "typeLiteral.spaceSurroundingProperties": true,
    "whileStatement.spaceAfterWhileKeyword": true,
    "arguments.spaceAround": false,
    "arrayExpression.spaceAround": false,
    "arrayPattern.spaceAround": false,
    "doWhileStatement.spaceAround": false,
    "forInStatement.spaceAround": false,
    "forOfStatement.spaceAround": false,
    "forStatement.spaceAround": false,
    "ifStatement.spaceAround": false,
    "parameters.spaceAround": false,
    "switchStatement.spaceAround": false,
    "tupleType.spaceAround": false,
    "whileStatement.spaceAround": false,
  },
  "toml": {
    "$schema":
      "https://plugins.dprint.dev/dprint/dprint-plugin-toml/0.4.0/schema.json",
    "deno": true,
    "commentLine.forceSpaceAfterSlashes": true,
    "ignoreNodeCommentText": "deno-fmt-ignore",
    "array.preferSingleLine": true,
    "object.preferSingleLine": true,
  },
} as const;

export type PluginConfiguration = Pick<
  typeof config,
  "json" | "toml" | "markdown" | "typescript"
>;

export type PluginName = typeof dprint.pluginNames[number];

/** Formats code. */
export interface Formatter {
  /**
   * Checks the specified file text to see if it is formatted.
   * @param text - File text to check.
   * @param overrideConfig - Configuration to set for a single format.
   * @returns `true` if formatted; otherwise, `false`.
   * @throws If there is an error formatting.
   */
  check(text: string, overrideConfig?: Record<string, unknown>): boolean;

  /**
   * Checks the specified file text to see if it is formatted.
   * @param filePath - The file path to check.
   * @param fileText - File text to check.
   * @param overrideConfig - Configuration to set for a single format.
   * @returns `true` if formatted; otherwise, `false`.
   * @throws If there is an error formatting.
   */
  checkText(
    filePath: string,
    fileText: string,
    overrideConfig?: Record<string, unknown>,
  ): boolean;

  /**
   * Formats the specified text.
   * @param text - The text to format.
   * @param overrideConfig - Configuration to set for a single format.
   * @returns The formatted text.
   * @throws If there is an error formatting.
   */
  format(text: string, overrideConfig?: Record<string, unknown>): string;

  /**
   * Formats the specified file text.
   * @param filePath - The file path to format.
   * @param fileText - File text to format.
   * @param overrideConfig - Configuration to set for a single format.
   * @returns The formatted text.
   * @throws If there is an error formatting.
   */
  formatText(
    filePath: string,
    fileText: string,
    overrideConfig?: Record<string, unknown>,
  ): string;

  /**
   * Sets the configuration.
   * @param globalConfig - Global configuration for use across plugins.
   * @param pluginConfig - Plugin specific configuration.
   */
  setConfig(
    globalConfig: GlobalConfiguration,
    pluginConfig: Record<string, unknown>,
  ): void;

  /** Gets the configuration diagnostics. */
  getConfigDiagnostics(): ConfigurationDiagnostic[];

  /** Gets the resolved configuration.*/
  getResolvedConfig(): Record<string, unknown>;

  /** Gets the plugin info. */
  getPluginInfo(): PluginInfo;

  /** Gets the license text of the plugin. */
  getLicenseText(): string;
}

/** Configuration specified for use across plugins. */
export interface GlobalConfiguration {
  lineWidth?: number;
  indentWidth?: number;
  useTabs?: boolean;
  newLineKind?: "auto" | "lf" | "crlf" | "system";
}

/** A diagnostic indicating a problem with the specified configuration. */
export interface ConfigurationDiagnostic {
  propertyName: string;
  message: string;
}

/** Information about a plugin. */
export interface PluginInfo {
  name: string;
  version: string;
  configKey: string;
  fileExtensions: string[];
  fileNames: string[];
  helpUrl: string;
  configSchemaUrl: string;
}

export interface ResponseLike {
  arrayBuffer(): Promise<BufferSource>;
}

export class dprint implements Formatter {
  static autoUpdate = true;
  static readonly pluginNames = [
    "json",
    "markdown",
    "toml",
    "typescript",
  ] as const;

  /**
   * Creates a formatter from the specified wasm instance.
   * @param wasmInstance - The WebAssembly instance.
   */
  constructor(wasmInstance: WebAssembly.Instance) {
    // deno-lint-ignore no-explicit-any
    this.#exports = wasmInstance.exports as any;

    const schemaVersion = this.#schemaVersion;
    const expectedVersion = 3;
    if (
      schemaVersion !== 2 &&
      schemaVersion !== expectedVersion
    ) {
      const pluginInfo = Object(this.#exports.get_plugin_info());
      const pluginName = "name" in pluginInfo ? pluginInfo.name : "unknown";
      throw new Error(
        `Incompatible plugin '${pluginName}'. ` +
          `Expected schema version ${expectedVersion}, but plugin had ${schemaVersion}.`,
      );
    }
    this.#configSet = false;
  }

  #configSet = false;
  #exports!: WebAssembly.Exports & {
    get_plugin_schema_version(): number;
    set_file_path(): void;
    set_override_config(): void;
    get_formatted_text(): number;
    format(): number;
    get_error_text(): number;
    get_plugin_info(): number;
    get_resolved_config(): number;
    get_config_diagnostics(): number;
    set_global_config(): void;
    set_plugin_config(): void;
    get_license_text(): number;
    get_wasm_memory_buffer(): number;
    get_wasm_memory_buffer_size(): number;
    add_to_shared_bytes_from_buffer(count: number): void;
    set_buffer_with_shared_bytes(index: number, count: number): void;
    clear_shared_bytes(count: number): void;
    reset_config?(): void;
    readonly memory: WebAssembly.Memory;
  };

  get #bufferSize(): number {
    return this.#exports.get_wasm_memory_buffer_size();
  }

  get #schemaVersion(): number {
    return this.#exports.get_plugin_schema_version();
  }

  check(text: string, overrideConfig?: Record<string, unknown>) {
    this.setConfigIfNotSet();
    const filename = this.getSyntheticFileName();
    return this.checkText(filename, text, overrideConfig);
  }

  format(text: string, overrideConfig?: Record<string, unknown>) {
    this.setConfigIfNotSet();
    const filename = this.getSyntheticFileName();
    return this.formatText(filename, text, overrideConfig);
  }

  formatText(
    filePath: string,
    fileText: string,
    overrideConfig?: Record<string, unknown>,
  ) {
    this.setConfigIfNotSet();
    if (overrideConfig != null) {
      if (this.#schemaVersion === 2) {
        throw new Error(
          "Cannot set the override configuration for this old plugin.",
        );
      }
      this.#sendString(JSON.stringify(overrideConfig));
      this.#exports.set_override_config();
    }

    this.#sendString(filePath);
    this.#exports.set_file_path();

    this.#sendString(fileText);
    const responseCode = this.#exports.format();
    switch (responseCode) {
      case 0: // no change
        return fileText;
      case 1: // change
        return this.#receiveString(this.#exports.get_formatted_text());
      case 2: // error
        throw new Error(this.#receiveString(this.#exports.get_error_text()));
      default:
        throw new Error(`Unexpected response code: ${responseCode}`);
    }
  }

  checkText(
    filePath: string,
    fileText: string,
    overrideConfig?: Record<string, unknown>,
  ) {
    this.setConfigIfNotSet();
    if (overrideConfig != null) {
      if (this.#schemaVersion === 2) {
        throw new Error(
          "Cannot set the override configuration for this old plugin.",
        );
      }
      this.#sendString(JSON.stringify(overrideConfig));
      this.#exports.set_override_config();
    }
    this.#sendString(filePath);
    this.#exports.set_file_path();

    this.#sendString(fileText);
    const responseCode = this.#exports.format();
    switch (responseCode) {
      case 0: // no change
        return true;
      case 1: // change
        return false;
      case 2: // error
        throw new Error(this.#receiveString(this.#exports.get_error_text()));
      default:
        throw new Error(`Unexpected response code: ${responseCode}`);
    }
  }

  getConfigDiagnostics() {
    this.setConfigIfNotSet();
    const length = this.#exports.get_config_diagnostics();
    return JSON.parse(this.#receiveString(length));
  }

  getLicenseText() {
    const length = this.#exports.get_license_text();
    return this.#receiveString(length);
  }

  getPluginInfo() {
    const length = this.#exports.get_plugin_info();
    const pluginInfo = JSON.parse(this.#receiveString(length)) as PluginInfo;
    pluginInfo.fileNames ??= [];
    return pluginInfo;
  }

  getResolvedConfig() {
    this.setConfigIfNotSet();
    const length = this.#exports.get_resolved_config();
    return JSON.parse(this.#receiveString(length));
  }

  getSyntheticFileName() {
    const { fileExtensions } = this.getPluginInfo();
    return `file.${fileExtensions[0]}`;
  }

  setConfigIfNotSet(
    globalConfig: GlobalConfiguration = {
      lineWidth: 80,
      indentWidth: 2,
      useTabs: false,
      newLineKind: "lf",
    },
    localConfig: Record<string, unknown> = {},
  ) {
    if (!this.#configSet) this.setConfig(globalConfig, localConfig);
  }

  setConfig(
    globalConfig: GlobalConfiguration,
    pluginConfig: Record<string, unknown>,
  ) {
    if (this.#exports.reset_config != null) this.#exports.reset_config();
    this.#sendString(JSON.stringify(globalConfig));
    this.#exports.set_global_config();
    this.#sendString(JSON.stringify(pluginConfig));
    this.#exports.set_plugin_config();
    this.#configSet = true;
  }

  #sendString(text: string) {
    const encodedText = encode(text);
    const length = encodedText.length;

    this.#exports.clear_shared_bytes(length);

    let index = 0;
    while (index < length) {
      const writeCount = Math.min(length - index, this.#bufferSize);
      const wasmBuffer = this.#getWasmBuffer(writeCount);
      for (let i = 0; i < writeCount; i++) {
        wasmBuffer[i] = encodedText[index + i];
      }
      this.#exports.add_to_shared_bytes_from_buffer(writeCount);
      index += writeCount;
    }
  }

  #receiveString(length: number) {
    const buffer = new Uint8Array(length);
    let index = 0;
    while (index < length) {
      const readCount = Math.min(length - index, this.#bufferSize);
      this.#exports.set_buffer_with_shared_bytes(index, readCount);
      const wasmBuffer = this.#getWasmBuffer(readCount);
      for (let i = 0; i < readCount; i++) {
        buffer[index + i] = wasmBuffer[i];
      }
      index += readCount;
    }
    return decode(buffer);
  }

  #getWasmBuffer(length: number) {
    const pointer = this.#exports.get_wasm_memory_buffer();
    const buffer = (this.#exports.memory as WebAssembly.Memory).buffer;
    return new Uint8Array(buffer, pointer, length);
  }

  static #canUpdatePlugins(): boolean {
    return !!dprint.autoUpdate && typeof Deno.Command === "function";
  }

  static async getPlugin(
    name: PluginName,
  ): Promise<Formatter> {
    try {
      const url = import.meta.resolve(`./wasm/${name}.wasm`);
      return dprint.create(fetch(url));
    } catch (err) {
      if (err.name === "NotFound" && dprint.#canUpdatePlugins()) {
        const cmd = new Deno.Command(Deno.execPath(), {
          args: [
            "run",
            "--allow-read",
            "--allow-write",
            "--allow-net",
            UPDATE_PLUGINS_SCRIPT,
            name,
          ],
          stdin: "null",
          stderr: "piped",
          stdout: "piped",
          cwd: import.meta.url.replace(/\/[^\/]+$/, ""),
        });

        const output = await cmd.output();

        if (!output.success) {
          const stderr = decode(output.stderr);
          const stdout = decode(output.stdout);
          throw new Error(
            `Failed to update WASM plugins (exit code ${output.code}).\n\nStderr: ${stderr}\n\nStdout: ${stdout}`,
          );
        }

        // try again
        return await dprint.getPlugin(name);
      } else {
        throw err;
      }
    }
  }

  static getPluginSync(name: PluginName): Formatter {
    try {
      const url = import.meta.resolve(`./wasm/${name}.wasm`).replace(
        /^file\:\/\//,
        "",
      );
      const buf = Deno.readFileSync(url);
      return dprint.create(buf.buffer);
    } catch (err) {
      if (err.name === "NotFound" && dprint.#canUpdatePlugins()) {
        // try to fetch and update the plugins synchronously
        // this is a little workaround for the fact that the Fetch API is a
        // strictly asynchronous API. we invoke a separate Deno process to
        // handle the asynchronous work, but we invoke it synchronously ;)
        const output = new Deno.Command(Deno.execPath(), {
          args: [
            "run",
            "--allow-read",
            "--allow-write",
            "--allow-net",
            UPDATE_PLUGINS_SCRIPT,
            name,
          ],
          stdin: "null",
          stderr: "piped",
          stdout: "piped",
          cwd: import.meta.url.replace(/\/[^\/]+$/, ""),
        }).outputSync();

        if (!output.success) {
          const stderr = decode(output.stderr);
          const stdout = decode(output.stdout);
          throw new Error(
            `Failed to update WASM plugins (exit code ${output.code}).\n\nStderr: ${stderr}\n\nStdout: ${stdout}`,
          );
        }

        // now let's try again
        return dprint.getPluginSync(name);
      } else {
        throw err;
      }
    }
  }

  /**
   * Creates the WebAssembly import object, if necessary.
   */
  static createImportObject(): WebAssembly.Imports {
    // for now, use an identity object
    const dprint = {
      "host_clear_bytes": () => {},
      "host_read_buffer": () => {},
      "host_write_buffer": () => {},
      "host_take_file_path": () => {},
      "host_take_override_config": () => {},
      "host_format": () => 0, // no change
      "host_get_formatted_text": () => 0, // zero length
      "host_get_error_text": () => 0, // zero length
    };

    return { dprint } as const;
  }

  static async getArrayBuffer(
    response:
      | ResponseLike
      | Blob
      | BufferSource
      | Promise<ResponseLike | Blob | BufferSource>,
  ): Promise<BufferSource> {
    if ("then" in response && typeof response.then === "function") {
      return await dprint.getArrayBuffer(await response);
    }
    if (response instanceof Blob) return await response.arrayBuffer();
    if (dprint.isResponse(response)) return await response.arrayBuffer();
    if (isAnyArrayBuffer(response)) return response;
    if (ArrayBuffer.isView(response)) return response.buffer;
    throw new TypeError("Invalid response type.");
  }

  private static isResponse(
    response: unknown,
  ): response is ResponseLike {
    return response != null &&
      (typeof response === "object" && !Array.isArray(response)) &&
      "arrayBuffer" in response &&
      typeof (response as Response).arrayBuffer === "function" != null;
  }

  static create(source: WebAssembly.Instance): Formatter;
  static create(
    source: ResponseLike | Promise<ResponseLike>,
  ): Promise<Formatter>;
  static create(source: BufferSource): Formatter;
  static create(
    source:
      | WebAssembly.Instance
      | ResponseLike
      | BufferSource
      | Promise<ResponseLike | BufferSource>,
  ) {
    if (source instanceof WebAssembly.Instance) {
      return dprint.createFromInstance(source);
    } else if (ArrayBuffer.isView(source) || isAnyArrayBuffer(source)) {
      return dprint.createFromBuffer(source);
    } else {
      return dprint.createStreaming(source);
    }
  }

  /**
   * Creates a formatter from the specified streaming source.
   * @remarks This is the most efficient way to create a formatter.
   * @param response - The streaming source to create the formatter from.
   */
  static async createStreaming(
    response: ResponseLike | Promise<BufferSource | ResponseLike>,
  ): Promise<Formatter> {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      const res = await response;
      if (dprint.isResponse(res)) {
        const { instance } = await WebAssembly.instantiateStreaming(
          await response as Response,
          dprint.createImportObject(),
        );
        return dprint.createFromInstance(instance);
      } else if (ArrayBuffer.isView(res) || isAnyArrayBuffer(res)) {
        return dprint.createFromBuffer(await dprint.getArrayBuffer(res));
      } else {
        throw new TypeError("Invalid wasm source type.");
      }
    } else {
      // fallback for node.js and older browsers
      const buffer = await dprint.getArrayBuffer(response);
      return dprint.createFromBuffer(buffer);
    }
  }

  /**
   * Creates a formatter from the specified wasm module bytes.
   * @param wasmModuleBuffer - The buffer of the wasm module.
   */
  static createFromBuffer(wasmModuleBuffer: BufferSource): Formatter {
    const wasmModule = new WebAssembly.Module(wasmModuleBuffer);
    const wasmInstance = new WebAssembly.Instance(
      wasmModule,
      dprint.createImportObject(),
    );
    return dprint.createFromInstance(wasmInstance);
  }

  /**
   * Creates a formatter from the specified wasm instance.
   * @param wasmInstance - The WebAssembly instance.
   */
  static createFromInstance(
    wasmInstance: WebAssembly.Instance,
  ): Formatter {
    return new dprint(wasmInstance);
  }
}

export declare namespace dprint {
  export type {
    ConfigurationDiagnostic,
    Formatter,
    GlobalConfiguration,
    PluginConfiguration,
    PluginInfo,
    PluginName,
    ResponseLike,
  };
}
