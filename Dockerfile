FROM --platform=linux/amd64 node:alpine

WORKDIR /app

COPY src /app/src/
COPY @types /app/@types
COPY package*.json /app/
COPY tsconfig.json /app/
RUN npm install
RUN npm run build

EXPOSE 8080
CMD ["node", "dist/src/server.js"]

# need to implement 2 stage Docker build eventually