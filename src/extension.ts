import * as vscode from "vscode";
import { getClipboardImage, isPngpasteInstalled } from "./clipboard";
import { saveToRemote } from "./fileWriter";
import { typeIntoTerminal, fallbackPaste } from "./terminal";

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel("SSH Screenshot Paste");

  const disposable = vscode.commands.registerCommand(
    "terminalScreenshotPaste.paste",
    handlePaste
  );

  context.subscriptions.push(disposable, outputChannel);
  outputChannel.appendLine("SSH Screenshot Paste activated");
}

async function handlePaste(): Promise<void> {
  // Guard 1: macOS only
  if (process.platform !== "darwin") {
    outputChannel.appendLine("Not macOS — falling back to normal paste");
    await fallbackPaste();
    return;
  }

  // Guard 2: remote session only
  if (!vscode.env.remoteName) {
    outputChannel.appendLine("Not a remote session — falling back to normal paste");
    await fallbackPaste();
    return;
  }

  // Guard 3: active terminal required
  if (!vscode.window.activeTerminal) {
    outputChannel.appendLine("No active terminal — falling back to normal paste");
    await fallbackPaste();
    return;
  }

  // Guard 4: workspace folder required
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    outputChannel.appendLine("No workspace folders — cannot determine remote path");
    vscode.window.showErrorMessage(
      "SSH Screenshot Paste: No workspace folder open. Open a remote folder first."
    );
    await fallbackPaste();
    return;
  }

  // Guard 5: pngpaste must be installed
  if (!isPngpasteInstalled()) {
    outputChannel.appendLine("pngpaste not found — falling back to normal paste");
    vscode.window.showWarningMessage(
      "SSH Screenshot Paste: pngpaste is not installed. Run: brew install pngpaste"
    );
    await fallbackPaste();
    return;
  }

  // Guard 6: check clipboard for image
  outputChannel.appendLine("Checking clipboard for image data...");
  const imageData = getClipboardImage();
  if (!imageData) {
    outputChannel.appendLine("No image on clipboard — falling back to normal paste");
    await fallbackPaste();
    return;
  }
  outputChannel.appendLine(`Image found on clipboard: ${imageData.length} bytes`);

  // Save to workspace
  const folder = folders[0];
  let filePath: string;
  try {
    filePath = await saveToRemote(imageData, folder, outputChannel);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    outputChannel.appendLine(`Failed to save screenshot: ${message}`);
    vscode.window.showErrorMessage(
      `SSH Screenshot Paste: Failed to save screenshot — ${message}`
    );
    await fallbackPaste();
    return;
  }

  // Success: type path into terminal
  outputChannel.appendLine(`Screenshot saved: ${filePath}`);
  typeIntoTerminal(filePath);
  vscode.window.setStatusBarMessage(`Screenshot saved: ${filePath}`, 3000);
}

export function deactivate(): void {
  // Nothing to clean up
}
