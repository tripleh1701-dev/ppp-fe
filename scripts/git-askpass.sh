#!/bin/sh
set -e
ENV_FILE="$(git rev-parse --show-toplevel)/.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^(GIT_USERNAME|GIT_PAT|GIT_EMAIL|GIT_HOST)=' "$ENV_FILE" | xargs)
fi
case "$1" in
  *"Username for"* ) echo "$GIT_USERNAME" ;;
  *"Password for"* ) echo "$GIT_PAT" ;;
  * ) echo "" ;;
 esac
