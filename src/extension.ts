import * as vscode from "vscode";
import { BigQueryCodelensProvider } from "./BigQueryCodelensProvider";

export function activate(context: vscode.ExtensionContext) {
  const bigQueryCodelensProvider = new BigQueryCodelensProvider();

  vscode.languages.registerCodeLensProvider("sql", bigQueryCodelensProvider);

  vscode.commands.registerCommand(
    "fastquery.bigqueryCodelensAction",
    (args: unknown) => {
      vscode.window.showInformationMessage(
        `CodeLens action clicked with args=${args}`
      );
    }
  );
}

export function deactivate() {}
