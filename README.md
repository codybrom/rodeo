<div align="center">
  <img src="images/icon.png" alt="Rodeo Logo" width="96" height="96">
  <h1>Rodeo (for VS Code)</h1>
  <p><strong>🤠 Wrangle your code context for AI collaboration</strong></p>
  <p><em>Formerly "GPT Context Generator" - Same powerful features, new name!</em></p>
  <p>
    <a href="https://marketplace.visualstudio.com/items?itemName=codybrom.gpt-context-generator"><img src="https://badgen.net/vs-marketplace/v/codybrom.gpt-context-generator" alt="VS Marketplace Version"></a>
    <a href="https://marketplace.visualstudio.com/items?itemName=codybrom.gpt-context-generator"><img src="https://badgen.net/vs-marketplace/i/codybrom.gpt-context-generator" alt="VS Marketplace Installs"></a>
    <a href="https://marketplace.visualstudio.com/items?itemName=codybrom.gpt-context-generator"><img src="https://badgen.net/vs-marketplace/d/codybrom.gpt-context-generator" alt="VS Marketplace Rating"></a>
  </p>
</div>

Rodeo is a Visual Studio Code extension that helps you generate LLM-ready context from your workspace files, making it easier to collaborate with AI models. The extension can automatically reference local code dependencies and respects your `.gitignore` rules to avoid including unnecessary files.

## Features

- Generate LLM-ready context from the currently open file and its imports, your entire VS Code workspace or marked files
- Generate context from all open editor tabs with or without their imports
- Smart mark/unmark functionality for files and folders via Explorer context menu
- Automatic file tracking updates marked files when they're moved or deleted
- Token count estimation for generated context
- Optional file type detection to include or exclude common programming file extensions
- Automatic support for multiple programming languages and file types
- Configurable markdown file handling - include raw or wrap in code blocks

## Usage

### Mark Files for Context

1. **Via Explorer**:
   - Right-click on one or more files or folders in the Explorer
   - Select "Mark for LLM Context"
   - Files appear in the Marked Files view
   - Marking a folder includes all compatible files within it

2. **Via Command Palette**:
   - Open a file
   - Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
   - Select "Mark/Unmark File for LLM Context"

### Generate Context

Five ways to generate context:

1. **Marked Files**:
   - Mark desired files by right-clicking them in the Explorer and selecting "Mark for LLM Context" or invoking the Command Palette (`Ctrl+Shift+P` on Windows or `Cmd+Shift+P` on Mac) while in an editor and selecting "Mark/Unmark File for LLM Context"
   - Then, click the "Generate LLM Context (Marked Files)" magic wand icon in the Marked for LLM Context view or invoke the Command Palette again and select "Generate LLM Context (Marked Files)" to generate context from all marked files

2. **Current File + Imports**:
   - When you have a file open in the editor, you can generate context for it along with its imports by invoking the Command Palette (`Ctrl+Shift+P` on Windows or `Cmd+Shift+P` on Mac), typing "Generate LLM Context", and selecting "Generate LLM Context (Current File + Imports)"

3. **All Open Files**:
   - Have multiple files open in editor tabs
   - Invoke the Command Palette (`Ctrl+Shift+P` on Windows or `Cmd+Shift+P` on Mac) and select "Generate LLM Context (All Open Files)"

4. **All Open Files + Imports**:
   - Have multiple files open in editor tabs
   - Invoke the Command Palette (`Ctrl+Shift+P` on Windows or `Cmd+Shift+P` on Mac) and select "Generate LLM Context (All Open Files + Imports)"

5. **Entire Workspace**:
   - Open a workspace
   - Invoke the Command Palette (`Ctrl+Shift+P` on Windows or `Cmd+Shift+P` on Mac) and select "Generate LLM Context (Workspace)"

The generated context will be copied to your clipboard or opened in a new window, based on your settings.

## Token Count Estimation

After generating context, you'll see an estimated token count. This helps you stay within AI model token limits. A warning appears if the context exceeds a configurable token limit (default: 32,000), but the generation will still proceed.

## Configuration

Configure the extension in VS Code settings:

- **Enable File Type Detection**
  - `enforceFileTypes`: Enable/disable file type detection (default: `true`)
  - When enabled, only files with extensions in `detectedFileExtensions` are processed
  - When disabled, all file types are included regardless of extension

- **Detected File Extensions**
  - Customize which file types to include (only when `enforceFileTypes` is enabled)
  - Supports many languages and formats:
    - JavaScript/TypeScript (js, jsx, ts, tsx, etc.)
    - Python (py, pyi, pyw, ipynb)
    - Ruby (rb, rake, erb, etc.)
    - PHP (php, phtml)
    - Swift/Objective-C (swift, m, h, etc.)
    - Systems (c, cpp, rs, go, etc.)
    - Web (html, css, scss, etc.)
    - Mobile (java, kt, dart, etc.)
    - Configuration (json, yaml, toml, etc.)
    - And more...

- **Ignore Files**
  - Files containing ignore patterns (like .gitignore)
  - Default: `.gitignore`, `.dockerignore`
  - Patterns from each file are used to exclude matching files from context
  - Files are processed in order, and missing ignore files are safely skipped

- **Token Warning Threshold**
  - Token count threshold for showing warnings
  - Default: `32000`

- **Output Method**
  - `clipboard`: Copy to clipboard (default)
  - `newWindow`: Open in new editor

- **Output Format** (for newWindow only)
  - `plaintext`: Plain text (default)
  - `markdown`: Markdown formatting

- **Include package.json** (for open file context only)
  - Include package.json when generating context for open file
  - Default: `false`

- **Markdown File Handling**
  - `raw`: Include markdown files as-is, preserving formatting (default)
  - `codeblock`: Wrap markdown files in code blocks like other files
  - Useful for documentation with embedded code examples

- **File Path Format**
  - Controls where file paths appear in generated context
  - `inline`: In code block header, e.g., ` ```js file.js` (default)
  - `comment`: As HTML comment before content, e.g., `<!-- File: file.js -->`
  - `none`: No file paths included
  - Using `comment` or `none` prevents LLMs from including paths in generated code

## Credits

- Primary development and icon: [@codybrom](https://github.com/codybrom)
- Original marked files feature: [@Aventuum](https://github.com/Aventuum)
- Magic wand icon: [@boxicons](https://github.com/atisawd/boxicons)

## License

© 2025 Cody Bromley and contributors.

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
