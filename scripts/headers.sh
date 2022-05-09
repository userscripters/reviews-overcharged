#!/bin/bash

dist="dist"
output=$dist"/main.js"

generate-headers tampermonkey \
    -o $output \
    -m all meta "https://domain/review/suggested-edits/*" \
    --collapse \
    --pretty
