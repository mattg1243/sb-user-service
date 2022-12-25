FROM --platform=linux/amd64 node:alpine

WORKDIR /app

COPY src /app/src/
COPY package*.json /app/
COPY tsconfig.json /app/
RUN npm install
RUN npm run build

EXPOSE 8080 4080
CMD ["npm", "run", "prodstart"]

# need to implement 2 stage Docker build eventually