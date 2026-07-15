# Project Bootstrap Design

`create` makes a new Git repository and applies the approved baseline modules. `init` detects an existing repository and proposes only missing assets. Both execute a plan transaction, preserve pre-existing files, and record generated module state.

Stack-specific Docker, CI, and test files require a detected stack plus an explicit module adapter.
