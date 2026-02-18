# Security & Trust

Spriters Bot is built with security and privacy as core pillars. Here is how we protect your server.

## 🔒 Isolation
- **Data Isolation:** Every server's configuration and log data is stored in separate, isolated files securely on the host system. No database is shared in a way that allows cross-server data leakage.
- **Scope Restriction:** Bot actions (cleaning, dates, anti-spam) are strictly scoped to the specific channels you configure. The bot never guesses or acts outside its boundaries.

## 🛡️ Moderation Safety
- **Anti-Spam Logic:** Our anti-spam system uses short-term memory (RAM) and does not persist user messages to disk. Once analyzed for flood/spam, the content is discarded.
- **Rate Limits:** To prevent abuse, the bot has internal rate limits and "Safety Skips" (it avoids talking in dead channels or executing infinite loops).
- **Confirmation:** Destructive actions (like clearing logs or bulk deleting messages manually) always require explicit admin confirmation via button interactions.

## 👮 Permissions
- **Admin Control:** Sensitive commands (logs, config, security) are strictly locked to users with `ManageServer` or Administrator permissions (or roles manually authorized by you).
- **Audit Logs:** The bot maintains an internal audit log of its own actions (cleanup, config changes, automated punishments) which admins can view via `/logs` or the `/status` dashboard.

## 🐛 Vulnerability Reporting
If you find a security issue, please contact the developer immediately via the GitHub repository. Do not exploit the vulnerability publicly.
