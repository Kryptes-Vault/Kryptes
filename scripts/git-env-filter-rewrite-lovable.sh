# Bracket characters in GitHub noreply emails (e.g. ...app[bot]@...) break shell
# glob matching in `case`; use fixed-string checks instead.
if [ "$GIT_AUTHOR_EMAIL" = "noreply@lovable.dev" ] ||
  printf '%s' "$GIT_AUTHOR_EMAIL" | grep -Fq 'gpt-engineer-app'; then
  export GIT_AUTHOR_NAME="Thanmayee Reddy Kotha"
  export GIT_AUTHOR_EMAIL="thanmayeereddykotha@gmail.com"
fi
if [ "$GIT_COMMITTER_EMAIL" = "noreply@lovable.dev" ] ||
  printf '%s' "$GIT_COMMITTER_EMAIL" | grep -Fq 'gpt-engineer-app'; then
  export GIT_COMMITTER_NAME="Thanmayee Reddy Kotha"
  export GIT_COMMITTER_EMAIL="thanmayeereddykotha@gmail.com"
fi
