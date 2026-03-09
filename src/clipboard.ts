import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/**
 * Checks whether pngpaste is available on the system.
 */
export function isPngpasteInstalled(): boolean {
  try {
    execFileSync("which", ["pngpaste"], { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts image data from the macOS clipboard using pngpaste.
 * Returns a Buffer containing PNG data, or null if no image is on the clipboard.
 *
 * Requires: brew install pngpaste
 */
export function getClipboardImage(): Buffer | null {
  const tempFile = path.join(
    os.tmpdir(),
    `vscode-clipboard-${Date.now()}.png`
  );

  try {
    execFileSync("pngpaste", [tempFile], { timeout: 3000 });

    if (!fs.existsSync(tempFile)) {
      return null;
    }

    const imageData = fs.readFileSync(tempFile);
    return imageData.length > 0 ? imageData : null;
  } catch {
    // pngpaste exits with code 1 when no image on clipboard
    return null;
  } finally {
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}
