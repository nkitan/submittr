git add .
msg="Update - $(date '+%d/%m/%Y')"
if [[ ! -z $1 ]]; then
    msg=$1
fi
git commit -m "$msg"
git push

