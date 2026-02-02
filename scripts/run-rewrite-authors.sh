#!/bin/sh
set -e
export FILTER_BRANCH_SQUELCH_WARNING=1
cd "$(dirname "$0")/.." || exit 1
FILTER=$(cat "$(dirname "$0")/git-env-filter-rewrite-lovable.sh")
git filter-branch -f --env-filter "$FILTER" --tag-name-filter cat -- --all
