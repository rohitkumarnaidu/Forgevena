# Installation

## npm

Run `npm install --global forgevena@1.2.0`, then verify with `forgevena version`. The legacy `ai-workspace` executable remains supported throughout 1.x.

## Offline and portable

Transfer the verified `.tgz` and `SHA256SUMS`, verify SHA-256, then run `./scripts/install-offline.ps1 -Tarball <path>` or `npm install --global <path-to-tarball>`. A portable checkout can run `node ./bin/ai-workspace.js`; Node.js 20.19+ remains required.

## Enterprise

Mirror the verified archive internally, pin the RC version, and distribute approved provider/cloud CLIs separately. Review installation scripts before execution.
