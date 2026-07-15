# Extension Guide

Add a module by registering a name in `src/modules.js` and providing lifecycle methods. Template assets must be additive and idempotent. Provider and plugin extensions must remain capability-limited and must not install third-party tools in Phase 2.
