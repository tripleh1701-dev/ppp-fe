#!/bin/bash

# Git askpass script that reads credentials from .env.local
# Usage: This script is called by Git when credentials are needed

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source the .env.local file if it exists
ENV_FILE="$PROJECT_ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: .env.local file not found at $ENV_FILE" >&2
    exit 1
fi

# Source the environment variables
source "$ENV_FILE"

# Check if we have the required variables
if [[ -z "$GIT_USERNAME" || -z "$GIT_PAT" || -z "$GIT_EMAIL" ]]; then
    echo "Error: Required environment variables not set in .env.local" >&2
    echo "Required: GIT_USERNAME, GIT_PAT, GIT_EMAIL" >&2
    exit 1
fi

# Security check: Ensure we're only using the correct username
if [[ "$GIT_USERNAME" != "tripleh1701-dev" ]]; then
    echo "Error: Invalid username. Only tripleh1701-dev is allowed." >&2
    echo "Current username in .env.local: $GIT_USERNAME" >&2
    exit 1
fi

# Check what Git is asking for
case "$1" in
    *Username*|*username*)
        echo "$GIT_USERNAME"
        ;;
    *Password*|*password*|*token*)
        echo "$GIT_PAT"
        ;;
    *)
        # Default to providing the PAT (Personal Access Token)
        echo "$GIT_PAT"
        ;;
esac