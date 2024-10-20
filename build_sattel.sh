#!/bin/bash
set -e
git submodule init
cd sattel
uv sync
source ./.venv/bin/activate
./build.sh
