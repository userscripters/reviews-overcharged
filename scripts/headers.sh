#!/bin/bash

dist="dist"
output=$dist"/main.js"

generate tampermonkey \
    -o $output \
    -m all https://domain/review/suggested-edits/* \
    -c \
    --pretty
