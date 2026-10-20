# Privacy and Data Controls

The service should publish a jurisdiction-specific legal notice reviewed by counsel before launch. This engineering baseline defines the behavior that notice must describe:

- Account data is stored in PostgreSQL and used to provide authentication, workspace, usage, and support functions.
- Conversations and uploaded documents are stored only for the configured retention period unless a user or legal hold requires longer retention.
- Provider requests contain only the context required for the requested task and are governed by the configured provider contract.
- Memory is disabled by default and must require explicit user consent. Users must be able to review, correct, and delete memory entries.
- Users can request a data export and account deletion. Deletion must cascade to conversations, messages, documents, chunks, usage, sessions, and audit references subject to legal retention.
- Operational logs intentionally omit raw prompt, completion, cookie, token, and file content.
- Access is restricted by role, tenant ownership, database row-level security, and audited administrative actions.
