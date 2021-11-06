
#!/bin/bash

ARGUMENT_LIST=(
  "message",
)
# default values
OPTS=$(getopt \
    --longoptions "$(printf "%s:," "${ARGUMENT_LIST[@]}")" \
    --name "$(basename "$0")" \
    --options "" \
    -- "$@"
)
# eval set -- "$OPTS"
message="child-shell"
while [[ $# -gt 0 ]]; do
  case "$1" in
      --message ) message="$2" ;;
  esac
  shift 2
done

echo $message
