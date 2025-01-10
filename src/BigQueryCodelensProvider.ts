import * as vscode from "vscode";
import BigQuerySQL from "tree-sitter-sql-bigquery";
import Parser from "tree-sitter";

export class BigQueryCodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private parser: Parser;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(BigQuerySQL);

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    this.codeLenses = [];
    const text = document.getText();
    const tree = this.parser.parse(text);
    const query = new Parser.Query(BigQuerySQL, "(query_statement) @query");
    query.matches(tree.rootNode).forEach((match) => {
      if (match.captures.length !== 0) {
        const nodePosition = match.captures[0].node.startPosition;
        const position = new vscode.Position(
          nodePosition.row,
          nodePosition.column
        );
        const range = document.getWordRangeAtPosition(position);
        if (range) {
          this.codeLenses.push(new vscode.CodeLens(range));
        }
      }
    });
    return this.codeLenses;
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens> {
    codeLens.command = {
      title: "Execute query",
      tooltip: "Tooltip provided by fastquery extension",
      command: "fastquery.bigqueryCodelensAction",
      arguments: ["Argument 1", false],
    };
    return codeLens;
  }
}
