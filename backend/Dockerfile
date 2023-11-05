FROM node:20

COPY . /app
WORKDIR /app

RUN npm config set registry "http://mirrors.cloud.tencent.com/npm/" && \
    npm install

CMD ["npm", "run", "start"]
# CMD ["bash"]