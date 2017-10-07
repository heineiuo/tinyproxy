FROM node:8.4.0-alpine

RUN mkdir -p /root/.youkuohao/tinyproxy
WORKDIR /root/.youkuohao/tinyproxy
COPY lib /root/.youkuohao/tinyproxy
COPY package.json /root/.youkuohao/tinyproxy

RUN npm install --registry="https://registry.npm.taobao.org" \
  && rm -rf /tmp/* \
  && rm -rf /root/.npm/
  
EXPOSE 443 80

CMD [ "node", "lib/index.js" ]
