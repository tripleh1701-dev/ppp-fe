#!/bin/bash

# Git askpass helper script that reads credentials from .env.local
# Usage: GIT_ASKPASS=./scripts/git-askpass.sh git push

# Find the .env.local file in the current directory or parent directories
ENV_FILE=""
DIR="$(pwd)"
while [[ "$DIR" != "/" ]]; do
    if [[ -f "$DIR/.env.local" ]]; then
        ENV_FILE="$DIR/.env.local"
        break
    fi
    DIR="$(dirname "$DIR")"
done

if [[ -z "$ENV_FILE" ]]; then
    echo "Error: .env.local file not found" >&2
    exit 1
fi

# Source the environment file
source "$ENV_FILE"

# Check if this is the correct user
if [[ "$GIT_USERNAME" != "tripleh1701-dev" ]]; then
    echo "Error: Wrong user. Expected tripleh1701-dev, got $GIT_USERNAME" >&2
    exit 1
fi

# Return the appropriate credential based on what Git is asking for
case "$1" in
    *Username*)
        echo "$GIT_USERNAME"
        ;;
    *Password*)
        if [[ -z "$GIT_PAT" ]]; then
            echo "Error: GIT_PAT not set in .env.local" >&2
            exit 1
        fi
        echo "$GIT_PAT"
        ;;
    *)
        echo "Error: Unknown credential request: $1" >&2
        exit 1
        ;;
esac
