// package: user
// file: proto/user.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class GetUserForLoginRequest extends jspb.Message { 
    getEmail(): string;
    setEmail(value: string): GetUserForLoginRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetUserForLoginRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetUserForLoginRequest): GetUserForLoginRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetUserForLoginRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetUserForLoginRequest;
    static deserializeBinaryFromReader(message: GetUserForLoginRequest, reader: jspb.BinaryReader): GetUserForLoginRequest;
}

export namespace GetUserForLoginRequest {
    export type AsObject = {
        email: string,
    }
}

export class GetUserForLoginResponse extends jspb.Message { 
    getId(): string;
    setId(value: string): GetUserForLoginResponse;
    getEmail(): string;
    setEmail(value: string): GetUserForLoginResponse;
    getArtistName(): string;
    setArtistName(value: string): GetUserForLoginResponse;
    getPassword(): string;
    setPassword(value: string): GetUserForLoginResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetUserForLoginResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetUserForLoginResponse): GetUserForLoginResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetUserForLoginResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetUserForLoginResponse;
    static deserializeBinaryFromReader(message: GetUserForLoginResponse, reader: jspb.BinaryReader): GetUserForLoginResponse;
}

export namespace GetUserForLoginResponse {
    export type AsObject = {
        id: string,
        email: string,
        artistName: string,
        password: string,
    }
}
