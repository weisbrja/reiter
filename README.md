# Reiter

Reiter is a simple GUI for [Pferd](https://github.com/Garmelon/PFERD/).

## Installation

You can either grab one of the executables from the [latest release](https://github.com/weisbrja/reiter/releases/latest), or you can build Reiter yourself by following the instructions below.

## Development

To compile Reiter, you first need to install [`Bun`](https://bun.sh) and [`uv`](https://docs.astral.sh/uv/).
Then you need to setup Tauri and the Rust toolchain by following the instructions provided on the [Tauri website](https://tauri.app/start/prerequisites/).

You now need to build the [Sattel](https://github.com/weisbrja/sattel/) git submodule in this repository by executing the `build_sattel.sh` script.

You can now run Reiter in development mode by executing the `run.sh` script or using `bun run tauri dev`.
