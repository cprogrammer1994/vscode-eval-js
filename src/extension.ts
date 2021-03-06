'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as safeEval from 'safe-eval';

// Returns the indentation
function indentOf(x) {
    return x.substr(0, x.indexOf(x.trim()));
}

// Wrap safeEval to increment `i`
function sEval(x, ctx) {
    let text = x.trim();
    if (text === '') {
        return '';
    }
    let res = safeEval(text, ctx);
    ctx['i'] += 1; // TODO: ugly
    return res;
}

// Selections are sorted by their start position
function compareSelection(a, b) {
    if (a.start.line < b.start.line) {
        return -1;
    }
    if (a.start.line > b.start.line) {
        return 1;
    }
    if (a.start.character < b.start.character) {
        return -1;
    }
    if (a.start.character > b.start.character) {
        return 1;
    }
    return 0;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let ctx = {
    }

    let disposable1 = vscode.commands.registerCommand('extension.evaluateAndReplaceSelection', () => {
        const editor = vscode.window.activeTextEditor;
        let selections: vscode.Selection[] = editor.selections;
        selections = selections.sort(compareSelection)

        editor.edit(builder => {
            ctx['i'] = 0;
            for (const selection of selections) {
                let text = editor.document.getText(selection);
                let result = text.split('\n').map(val => sEval(val, ctx)).join('\n');
                builder.replace(selection, indentOf(text) + result);
            }
        });
    });

    let disposable2 = vscode.commands.registerCommand('extension.evaluateSelectionInGlobalContext', () => {
        const editor = vscode.window.activeTextEditor;
        let selections: vscode.Selection[] = editor.selections;
        selections = selections.sort(compareSelection)

        editor.edit(builder => {
            ctx['i'] = 0;
            for (const selection of selections) {
                let text = editor.document.getText(selection);
                let lines = text.split('\n');
                for (const line of lines) {
                    let sep = line.indexOf('=');
                    if (sep < 0) {
                        continue;
                    }
                    let name = line.substr(0, sep).trim();
                    let value = line.substr(sep + 1).trim();
                    ctx[name] = sEval(value, ctx);
                }
            }
        });
    });

    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
