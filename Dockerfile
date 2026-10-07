FROM quay.io/qasimtech/mega-md:latest

WORKDIR /root/mega-md

RUN git clone https://github.com/GlobalTechInfo/MEGA-MD . && \
    npm install && \
    npm install @vitalets/google-translate-api

COPY arabic-localizer.js ./arabic-localizer.js

RUN python3 - <<'PY'
from pathlib import Path
p = Path("index.js")
s = p.read_text()
if "arabic-localizer" not in s:
    s = s.replace(
        "import commandHandler from './lib/commandHandler.js';",
        "import commandHandler from './lib/commandHandler.js';\nimport { installArabicLocalizer } from './arabic-localizer.js';"
    )
s = s.replace(
    "QasimDev.store = store;",
    "QasimDev.store = store;\n        installArabicLocalizer(QasimDev);"
)
p.write_text(s)
PY

EXPOSE 5000

CMD ["npm", "start"]
