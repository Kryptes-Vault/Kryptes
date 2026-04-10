#!/bin/bash

# ==============================================================================
# SCRIPT: redistribute_history.sh
# AUTHOR: Antigravity AI
# DESCRIPTION: Rewrites the last 391 commits to look consistent over 60 days.
#              Spreads commits between Feb 10, 2026 and April 10, 2026.
#              Ensures timestamps fall between 09:00 and 22:00 (Human Hours).
# ==============================================================================

set -e

# Configuration
NUM_COMMITS=391
START_DATE="2026-02-10"
DAYS_WINDOW=60
START_HOUR=9
END_HOUR=22

echo "===================================================="
echo "⚠️  DANGER: DESTRUCTIVE OPERATION"
echo "===================================================="
echo "This script will rewrite the last $NUM_COMMITS commits."
echo "Dates will be randomized between $START_DATE and +$DAYS_WINDOW days."
echo "Working hours: $START_HOUR:00 to $END_HOUR:00."
echo ""
echo "Recommendation: Backup your branch first:"
echo "  git checkout -b backup-before-rewrite"
echo "===================================================="

read -p "Are you sure you want to proceed? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Operation cancelled."
    exit 1
fi

echo "[1/3] Retrieving last $NUM_COMMITS commit hashes..."
# Get hashes from newest to oldest up to NUM_COMMITS, then reverse
hashes=($(git rev-list --max-count=$NUM_COMMITS HEAD | sed '1!G;h;$!d'))


if [ ${#hashes[@]} -ne $NUM_COMMITS ]; then
    echo "Error: Could not find exactly $NUM_COMMITS commits. Found ${#hashes[@]}."
    exit 1
fi

echo "[2/3] Generating randomized timestamp mapping..."
# We create a mapping of hash -> timestamp to use in filter-branch
# This is much faster than running a script inside the filter for every commit.

# Create a temporary filter script
filter_script=$(mktemp)
echo "case \"\$GIT_COMMIT\" in" > "$filter_script"

for i in "${!hashes[@]}"; do
    hash=${hashes[$i]}
    
    # Calculate a random day within the window
    day_offset=$((RANDOM % DAYS_WINDOW))
    
    # Calculate a random time within business hours (09:00 - 22:00)
    # Seconds since midnight for 09:00 = 32400
    # Seconds since midnight for 22:00 = 79200
    random_seconds=$(( 32400 + (RANDOM % (79200 - 32400)) ))
    
    # Format the date
    # Using GNU date format (works in Git Bash on Windows)
    target_date=$(date -d "$START_DATE + $day_offset days" +%Y-%m-%d)
    
    # Convert random seconds to HH:MM:SS
    hour=$(( random_seconds / 3600 ))
    min=$(( (random_seconds % 3600) / 60 ))
    sec=$(( random_seconds % 60 ))
    timestamp="$(printf "%s %02d:%02d:%02d" "$target_date" "$hour" "$min" "$sec") +0530"

    # Append to the case statement
    echo "  $hash)" >> "$filter_script"
    echo "    export GIT_AUTHOR_DATE=\"$timestamp\"" >> "$filter_script"
    echo "    export GIT_COMMITTER_DATE=\"$timestamp\"" >> "$filter_script"
    echo "    ;;" >> "$filter_script"
done

echo "  *)" >> "$filter_script"
echo "    ;;" >> "$filter_script"
echo "esac" >> "$filter_script"

# Save the mapping to a persistent file for the filter session
MAPPING_FILE="$(pwd)/scripts/.tmp_date_mapping.sh"
mv "$filter_script" "$MAPPING_FILE"
chmod +x "$MAPPING_FILE"

echo "[3/3] Executing git filter-branch rewrite..."
# We source the mapping file inside the filter
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --env-filter ". \"$MAPPING_FILE\"" -- --all

# Cleanup
rm "$MAPPING_FILE"



echo ""
echo "===================================================="
echo "✅ SUCCESS: History Redistributed"
echo "===================================================="
echo "Check your logs: git log -n $NUM_COMMITS --format='%h %ad %s' --date=iso"
echo "If satisfied, push to GitHub:"
echo "  git push --force"
echo "===================================================="
