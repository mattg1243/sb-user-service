// package: user
// file: proto/user.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as proto_user_pb from "../proto/user_pb";

interface IUserService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getUserForLogin: IUserService_IGetUserForLogin;
}

interface IUserService_IGetUserForLogin extends grpc.MethodDefinition<proto_user_pb.GetUserForLoginRequest, proto_user_pb.GetUserForLoginResponse> {
    path: "/user.User/GetUserForLogin";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_user_pb.GetUserForLoginRequest>;
    requestDeserialize: grpc.deserialize<proto_user_pb.GetUserForLoginRequest>;
    responseSerialize: grpc.serialize<proto_user_pb.GetUserForLoginResponse>;
    responseDeserialize: grpc.deserialize<proto_user_pb.GetUserForLoginResponse>;
}

export const UserService: IUserService;

export interface IUserServer extends grpc.UntypedServiceImplementation {
    getUserForLogin: grpc.handleUnaryCall<proto_user_pb.GetUserForLoginRequest, proto_user_pb.GetUserForLoginResponse>;
}

export interface IUserClient {
    getUserForLogin(request: proto_user_pb.GetUserForLoginRequest, callback: (error: grpc.ServiceError | null, response: proto_user_pb.GetUserForLoginResponse) => void): grpc.ClientUnaryCall;
    getUserForLogin(request: proto_user_pb.GetUserForLoginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_user_pb.GetUserForLoginResponse) => void): grpc.ClientUnaryCall;
    getUserForLogin(request: proto_user_pb.GetUserForLoginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_user_pb.GetUserForLoginResponse) => void): grpc.ClientUnaryCall;
}

export class UserClient extends grpc.Client implements IUserClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getUserForLogin(request: proto_user_pb.GetUserForLoginRequest, callback: (error: grpc.ServiceError | null, response: proto_user_pb.GetUserForLoginResponse) => void): grpc.ClientUnaryCall;
    public getUserForLogin(request: proto_user_pb.GetUserForLoginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_user_pb.GetUserForLoginResponse) => void): grpc.ClientUnaryCall;
    public getUserForLogin(request: proto_user_pb.GetUserForLoginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_user_pb.GetUserForLoginResponse) => void): grpc.ClientUnaryCall;
}
