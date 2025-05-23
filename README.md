# Rodeo – LLM Context Generator

[![VS Marketplace Version](https://badgen.net/vs-marketplace/v/codybrom.gpt-context-generator)](https://marketplace.visualstudio.com/items?itemName=codybrom.gpt-context-generator)
[![VS Marketplace Installs](https://badgen.net/vs-marketplace/i/codybrom.gpt-context-generator)](https://marketplace.visualstudio.com/items?itemName=codybrom.gpt-context-generator)
[![VS Marketplace Rating](https://badgen.net/vs-marketplace/d/codybrom.gpt-context-generator)](https://marketplace.visualstudio.com/items?itemName=codybrom.gpt-context-generator)

Rodeo is a Visual Studio Code extension helps you generate LLM-ready context from your workspace files, making it easier to collaborate with AI models. The extension can automatically reference local code dependencies and respects your `.gitignore` rules to avoid including unnecessary files.

## Features

- Generate LLM-ready context from the currently open file and its imports, your entire VS Code workspace or marked files
- Mark or unmark open files via Command Palette, or individual files and folders via the Explorer context menu
- Automatic file tracking updates marked files when they're moved or deleted
- Token count estimation for generated context
- Optional file type detection to include or exclude common programming file extensions
- Automatic support for multiple programming languages and file types

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

Three ways to generate context:

1. **Current File + Imports**:
   - Open a file
   - Command Palette → "Generate LLM Context (Current File + Imports)"

2. **Workspace**:
   - Open a workspace
   - Command Palette → "Generate LLM Context (Workspace)"

3. **Marked Files**:
   - Mark desired files
   - Command Palette → "Generate LLM Context (Marked Files)"

The generated context will be copied to your clipboard or opened in a new window, based on your settings.

## Token Count Estimation

After generating context, you'll see an estimated token count. This helps you stay within AI model token limits. A warning appears if the context exceeds a configurable token limit (default: 32,000).

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
  - Default: `true`

## Credits

- Primary development: [@codybrom](https://github.com/codybrom)
- Marked Files feature: [@Aventuum](https://github.com/Aventuum)
- Magic Wand icon: [@boxicons](https://github.com/atisawd/boxicons)

## License

© Cody Bromley and contributors. All rights reserved. Rodeo, "LLM Rodeo" and all trademark rights are reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

