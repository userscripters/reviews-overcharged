#!/bin/bash

dist="dist"
output=$dist"/headers.js"

generate tampermonkey \
    -o $output \
    -m $(cat .matches)

userscript=$dist"/$(ls $dist -1 | grep -e "main\.js")"

sed -i -e "{1e cat $output; echo; echo" -e "; N}" "$userscript"
