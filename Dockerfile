FROM quay.io/qasimtech/mega-md:latest

WORKDIR /root/mega-md

RUN git clone https://github.com/GlobalTechInfo/MEGA-MD . && \
    npm install

COPY arabic-menu.js ./plugins/arabic-menu.js
COPY zzz-arabic-aliases.js ./plugins/zzz-arabic-aliases.js

EXPOSE 5000

CMD ["npm", "start"]
