#!/bin/bash
set -e
git submodule init
git submodule update
cd sattel
uv sync
source ./.venv/bin/activate
./build.sh
