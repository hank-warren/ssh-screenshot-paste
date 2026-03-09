import * as vscode from "vscode";

/**
 * Types text into the active terminal without pressing Enter.
 */
export function typeIntoTerminal(text: string): void {
  const terminal = vscode.window.activeTerminal;
  if (terminal) {
    terminal.sendText(text, false);
  }
}

/**
 * Falls back to the normal VS Code terminal paste command.
 */
export async function fallbackPaste(): Promise<void> {
  await vscode.commands.executeCommand("workbench.action.terminal.paste");
}
