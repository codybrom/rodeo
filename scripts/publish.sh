#!/bin/bash

# Load environment variables if .env exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if PAT is set
if [ -z "$VSCE_PAT" ]; then
  echo "Error: VSCE_PAT is not set. Please add it to your .env file."
  exit 1
fi

# Publish the extension
npx @vscode/vsce publish -p $VSCE_PAT