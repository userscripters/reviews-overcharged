#!/bin/bash

gulp build &&
    npm run headers-tm &&
    npm run readme &&
    npm run stackapps
