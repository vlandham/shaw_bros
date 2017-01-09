#!/bin/bash

mkdir -p out
rm -f out/shaw.json
scrapy crawl shaw -o out/shaw.json
