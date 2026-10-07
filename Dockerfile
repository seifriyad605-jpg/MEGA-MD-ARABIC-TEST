FROM quay.io/qasimtech/mega-md:latest

WORKDIR /root/mega-md

RUN git clone https://github.com/GlobalTechInfo/MEGA-MD . && \
    npm install && \
    npm install @vitalets/google-translate-api

COPY config.js ./config.js
COPY arabic-localizer.js ./arabic-localizer.js
COPY menu-router.js ./menu-router.js
COPY channel-message-config.js ./lib/messageConfig.js
COPY isAdmin.js ./lib/isAdmin.js
# Copy every manually localized plugin so the Docker image uses our Arabic versions.
COPY plugins/ ./plugins/

RUN python3 - <<'PY'
from pathlib import Path
p = Path("index.js")
s = p.read_text()
if "arabic-localizer" not in s:
    s = s.replace(
        "import commandHandler from './lib/commandHandler.js';",
        """import commandHandler from './lib/commandHandler.js';
import { installArabicLocalizer } from './arabic-localizer.js';
import { handleInteractiveSelection } from './menu-router.js';"""
    )
s = s.replace(
    "QasimDev.store = store;",
    "QasimDev.store = store;\n        installArabicLocalizer(QasimDev);"
)
p.write_text(s)
PY

EXPOSE 5000

CMD ["npm", "start"]
