# ADR 0011: Render Git-Backed Deployment

Render integration uses additive Blueprints and explicit registered service identifiers. Secrets use `sync: false` or external environment references. The workspace never pushes source, provisions secrets, or deletes services. Deployment and status calls require consent; rollback remains a plan that preserves cloud resources.
