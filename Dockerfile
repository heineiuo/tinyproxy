FROM node:8.4.0-alpine

RUN mkdir -p /root/.youkuohao/tinyproxy
COPY lib /root
COPY package.json /root

WORKDIR /root

RUN npm install --registry="https://registry.npm.taobao.org" \
  && rm -rf /tmp/* \
  && rm -rf /root/.npm/
  
EXPOSE 443 80 53

CMD [ "node", "index.js" ]
