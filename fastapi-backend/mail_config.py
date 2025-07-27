# mail_config.py
from fastapi_mail import ConnectionConfig

conf = ConnectionConfig(
    MAIL_USERNAME="inspectionsapp65@gmail.com",
    MAIL_PASSWORD="bpem qvkx ujbn yklf",
    MAIL_FROM="inspectionsapp65@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",  # Change if not Gmail
    MAIL_FROM_NAME="Inspection Admin",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)