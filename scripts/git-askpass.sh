#!/bin/bash
# Load environment variables from .env.local
if [ -f "$(git rev-parse --show-toplevel)/.env.local" ]; then
    source "$(git rev-parse --show-toplevel)/.env.local"
fi

# Check if trying to authenticate as the correct user
if [[ "$1" == *"$GIT_USERNAME"* ]] || [[ "$1" == *"$GIT_HOST"* ]]; then
    echo "$GIT_PAT"
else
    echo "Error: Attempting to authenticate as unauthorized user. Expected: $GIT_USERNAME" >&2
    exit 1
fi
