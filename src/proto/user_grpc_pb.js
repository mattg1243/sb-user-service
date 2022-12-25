// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var proto_user_pb = require('../proto/user_pb.js');

function serialize_user_GetUserForLoginRequest(arg) {
  if (!(arg instanceof proto_user_pb.GetUserForLoginRequest)) {
    throw new Error('Expected argument of type user.GetUserForLoginRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_GetUserForLoginRequest(buffer_arg) {
  return proto_user_pb.GetUserForLoginRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_user_GetUserForLoginResponse(arg) {
  if (!(arg instanceof proto_user_pb.GetUserForLoginResponse)) {
    throw new Error('Expected argument of type user.GetUserForLoginResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_user_GetUserForLoginResponse(buffer_arg) {
  return proto_user_pb.GetUserForLoginResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var UserService = exports.UserService = {
  // called by Auth service to get a User object for token signing
getUserForLogin: {
    path: '/user.User/GetUserForLogin',
    requestStream: false,
    responseStream: false,
    requestType: proto_user_pb.GetUserForLoginRequest,
    responseType: proto_user_pb.GetUserForLoginResponse,
    requestSerialize: serialize_user_GetUserForLoginRequest,
    requestDeserialize: deserialize_user_GetUserForLoginRequest,
    responseSerialize: serialize_user_GetUserForLoginResponse,
    responseDeserialize: deserialize_user_GetUserForLoginResponse,
  },
};

exports.UserClient = grpc.makeGenericClientConstructor(UserService);
