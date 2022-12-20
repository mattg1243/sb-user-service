#!/bin/bash

PROTO_DIR=./

# generate code JS
npm run grpc_tools_node_protoc \
  --js_out=import_style=commonjs,binary:${PROTO_DIR} \
  --grpc_out=${PROTO_DIR} \
  --plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \
  -I ./proto \
  ./*.proto

# generate ts types
npm run grpc_tools_node_protoc \
  --plugin=protoc-gent-ts=./node_modules/.bin/protoc-gen-ts \
  --ts_out=${PROTO_DIR} \
  -I ./proto \
  ./*.proto