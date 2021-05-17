

if [ $# -lt 2 ]; then
    1>&2 echo "not enough arguments"
    exit 1
fi

if [ $# -gt 4 ]; then
    1>&2 echo "too many arguments"
    exit 1
fi

if [[ -z "$1" ] || [ -z "$2" ]]; then
    1>&2 echo "please provide language/code"
    exit 1
fi

