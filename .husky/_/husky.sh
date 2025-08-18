#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    [ "$HUSKY_DEBUG" = "true" ] && echo "$@"
  }
  readonly hook_name="$(basename "$0")"
  debug "husky > $hook_name" "npm v$(npm --version)"
  if [ "$HUSKY" = "0" ]; then
    debug "husky > Skipping hook (HUSKY=0)"
    exit 0
  fi
  if [ -z "$CI" ]; then
    case "$hook_name" in
      "pre-commit" | "pre-rebase" | "prepare-commit-msg" | "commit-msg" | "post-commit" | "post-rewrite")
        command -v git && [ -f ".git/hooks/$hook_name" ] && echo "husky > Detected old-style hook, disabling..." && mv ".git/hooks/$hook_name" ".git/hooks/$hook_name.old";;
    esac
  fi
  export HUSKY_SKIP_INIT=1
  sh -e "$(dirname "$0")/../.huskyrc.sh" "$@"
else
  exit 0
fi