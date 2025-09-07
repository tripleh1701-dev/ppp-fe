#!/bin/bash
# Validation script to ensure only tripleh1701-dev can push

set -e

# Load environment variables
ENV_FILE="$(git rev-parse --show-toplevel)/.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^(GIT_USERNAME|GIT_EMAIL)=' "$ENV_FILE" | xargs)
fi

# Get current git user
CURRENT_USER=$(git config user.name)
CURRENT_EMAIL=$(git config user.email)

# Validate user
if [ "$CURRENT_USER" != "tripleh1701-dev" ] || [ "$CURRENT_EMAIL" != "tripleh1701@gmail.com" ]; then
    echo "❌ ERROR: Invalid user attempting to push!"
    echo "Expected: tripleh1701-dev <tripleh1701@gmail.com>"
    echo "Current:  $CURRENT_USER <$CURRENT_EMAIL>"
    echo "Push aborted for security reasons."
    exit 1
fi

echo "✅ User validation passed: $CURRENT_USER <$CURRENT_EMAIL>"
