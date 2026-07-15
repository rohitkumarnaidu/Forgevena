# Module Manager

The module manager creates a plan from selected modules and the current filesystem. It skips existing files, applies only absent files, records installed modules, and supports update migrations.

Conflicts are surfaced as `skipped`, never silently merged or overwritten.
