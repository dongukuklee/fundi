/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */


import type { Context } from "./src/context"
import type { core } from "nexus"
declare global {
  interface NexusGenCustomInputMethods<TypeName extends string> {
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    dateTime<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // "DateTime";
    /**
     * The `BigInt` scalar type represents non-fractional signed whole numeric values.
     */
    bigInt<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // "BigInt";
  }
}
declare global {
  interface NexusGenCustomOutputMethods<TypeName extends string> {
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    dateTime<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "DateTime";
    /**
     * The `BigInt` scalar type represents non-fractional signed whole numeric values.
     */
    bigInt<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "BigInt";
  }
}


declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
}

export interface NexusGenEnums {
  FundingStatus: "CAMPAIGNING" | "END" | "POST_CAMPAIGN" | "PRE_CAMPAIGN"
  Role: "ADMIN" | "INVESTOR" | "MANAGER"
  TransactionType: "DEPOSIT" | "WITHDRAW"
}

export interface NexusGenScalars {
  String: string
  Int: number
  Float: number
  Boolean: boolean
  ID: string
  BigInt: any
  DateTime: any
}

export interface NexusGenObjects {
  AccountBond: { // root type
    balance: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  AccountCash: { // root type
    balance: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Artist: { // root type
    age?: number | null; // Int
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    name: string; // String!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Artwork: { // root type
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    initialPrice: NexusGenScalars['BigInt']; // BigInt!
    isSold: boolean; // Boolean!
    sellingPrice: NexusGenScalars['BigInt']; // BigInt!
    title: string; // String!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Auth: { // root type
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  AuthPayload: { // root type
    token: string; // String!
    user: NexusGenRootTypes['User']; // User!
  }
  Contract: { // root type
    artworksRequiredNumber: number; // Int!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    price: NexusGenScalars['BigInt']; // BigInt!
    terms: number; // Int!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Funding: { // root type
    bondPrice: NexusGenScalars['BigInt']; // BigInt!
    bondsTotalNumber: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    status: NexusGenEnums['FundingStatus']; // FundingStatus!
    title: string; // String!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Mutation: {};
  Query: {};
  TransactionBond: { // root type
    amount: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    title: string; // String!
    type: NexusGenEnums['TransactionType']; // TransactionType!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  TransactionCash: { // root type
    amount: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    title: string; // String!
    type: NexusGenEnums['TransactionType']; // TransactionType!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  TransactionSettlement: { // root type
    additionalSettleMentAmount: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    round: number; // Int!
    settlementAmount: NexusGenScalars['BigInt']; // BigInt!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  User: { // root type
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    email: string; // String!
    id: number; // Int!
    name?: string | null; // String
    role: NexusGenEnums['Role']; // Role!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
}

export interface NexusGenInterfaces {
}

export interface NexusGenUnions {
}

export type NexusGenRootTypes = NexusGenObjects

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars & NexusGenEnums

export interface NexusGenFieldTypes {
  AccountBond: { // field return type
    balance: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    funding: NexusGenRootTypes['Funding'] | null; // Funding
    id: number; // Int!
    owner: NexusGenRootTypes['User'] | null; // User
    transactionSettlement: NexusGenRootTypes['TransactionSettlement'][]; // [TransactionSettlement!]!
    transactions: NexusGenRootTypes['TransactionBond'][]; // [TransactionBond!]!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  AccountCash: { // field return type
    balance: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    owner: NexusGenRootTypes['User'] | null; // User
    transactions: NexusGenRootTypes['TransactionCash'][]; // [TransactionCash!]!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Artist: { // field return type
    age: number | null; // Int
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    fundings: NexusGenRootTypes['Funding'][]; // [Funding!]!
    id: number; // Int!
    name: string; // String!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Artwork: { // field return type
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    funding: NexusGenRootTypes['Funding'] | null; // Funding
    id: number; // Int!
    initialPrice: NexusGenScalars['BigInt']; // BigInt!
    isSold: boolean; // Boolean!
    sellingPrice: NexusGenScalars['BigInt']; // BigInt!
    title: string; // String!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Auth: { // field return type
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
    user: NexusGenRootTypes['User'] | null; // User
  }
  AuthPayload: { // field return type
    token: string; // String!
    user: NexusGenRootTypes['User']; // User!
  }
  Contract: { // field return type
    artworksRequiredNumber: number; // Int!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    funding: NexusGenRootTypes['Funding'] | null; // Funding
    id: number; // Int!
    price: NexusGenScalars['BigInt']; // BigInt!
    terms: number; // Int!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Funding: { // field return type
    accounstInvestor: NexusGenRootTypes['AccountBond'][]; // [AccountBond!]!
    accountManager: NexusGenRootTypes['AccountBond'] | null; // AccountBond
    artist: NexusGenRootTypes['Artist'] | null; // Artist
    artworks: NexusGenRootTypes['Artwork'][]; // [Artwork!]!
    bondPrice: NexusGenScalars['BigInt']; // BigInt!
    bondsRemaining: NexusGenScalars['BigInt']; // BigInt!
    bondsTotalNumber: NexusGenScalars['BigInt']; // BigInt!
    contract: NexusGenRootTypes['Contract'] | null; // Contract
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    status: NexusGenEnums['FundingStatus']; // FundingStatus!
    title: string; // String!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Mutation: { // field return type
    emailAuthentication: string | null; // String
    fundingSettlement: NexusGenRootTypes['Funding'] | null; // Funding
    participateFunding: NexusGenRootTypes['AccountBond'] | null; // AccountBond
    signin: NexusGenRootTypes['AuthPayload']; // AuthPayload!
    signup: NexusGenRootTypes['AuthPayload']; // AuthPayload!
  }
  Query: { // field return type
    artist: NexusGenRootTypes['Artist'] | null; // Artist
    artists: NexusGenRootTypes['Artist'][]; // [Artist!]!
    artwork: NexusGenRootTypes['Artwork'] | null; // Artwork
    artworks: NexusGenRootTypes['Artwork'][]; // [Artwork!]!
    balanceCash: NexusGenScalars['BigInt'] | null; // BigInt
    emailCheck: NexusGenRootTypes['Auth']; // Auth!
    funding: NexusGenRootTypes['Funding'] | null; // Funding
    fundings: NexusGenRootTypes['Funding'][]; // [Funding!]!
    myFundings: NexusGenRootTypes['Funding'][]; // [Funding!]!
    transactionsBond: NexusGenRootTypes['TransactionBond'][]; // [TransactionBond!]!
    transactionsCash: NexusGenRootTypes['TransactionCash'][]; // [TransactionCash!]!
    user: NexusGenRootTypes['User'] | null; // User
    verificationCode: boolean; // Boolean!
  }
  TransactionBond: { // field return type
    account: NexusGenRootTypes['AccountBond'] | null; // AccountBond
    amount: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    title: string; // String!
    type: NexusGenEnums['TransactionType']; // TransactionType!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  TransactionCash: { // field return type
    account: NexusGenRootTypes['AccountCash'] | null; // AccountCash
    amount: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    title: string; // String!
    type: NexusGenEnums['TransactionType']; // TransactionType!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  TransactionSettlement: { // field return type
    account: NexusGenRootTypes['AccountBond'] | null; // AccountBond
    additionalSettleMentAmount: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    round: number; // Int!
    settlementAmount: NexusGenScalars['BigInt']; // BigInt!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  User: { // field return type
    accountCash: NexusGenRootTypes['AccountCash'] | null; // AccountCash
    accountsBond: NexusGenRootTypes['AccountBond'][]; // [AccountBond!]!
    auth: NexusGenRootTypes['Auth'] | null; // Auth
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    email: string; // String!
    id: number; // Int!
    name: string | null; // String
    role: NexusGenEnums['Role']; // Role!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
}

export interface NexusGenFieldTypeNames {
  AccountBond: { // field return type name
    balance: 'BigInt'
    createdAt: 'DateTime'
    funding: 'Funding'
    id: 'Int'
    owner: 'User'
    transactionSettlement: 'TransactionSettlement'
    transactions: 'TransactionBond'
    updatedAt: 'DateTime'
  }
  AccountCash: { // field return type name
    balance: 'BigInt'
    createdAt: 'DateTime'
    id: 'Int'
    owner: 'User'
    transactions: 'TransactionCash'
    updatedAt: 'DateTime'
  }
  Artist: { // field return type name
    age: 'Int'
    createdAt: 'DateTime'
    fundings: 'Funding'
    id: 'Int'
    name: 'String'
    updatedAt: 'DateTime'
  }
  Artwork: { // field return type name
    createdAt: 'DateTime'
    funding: 'Funding'
    id: 'Int'
    initialPrice: 'BigInt'
    isSold: 'Boolean'
    sellingPrice: 'BigInt'
    title: 'String'
    updatedAt: 'DateTime'
  }
  Auth: { // field return type name
    createdAt: 'DateTime'
    id: 'Int'
    updatedAt: 'DateTime'
    user: 'User'
  }
  AuthPayload: { // field return type name
    token: 'String'
    user: 'User'
  }
  Contract: { // field return type name
    artworksRequiredNumber: 'Int'
    createdAt: 'DateTime'
    funding: 'Funding'
    id: 'Int'
    price: 'BigInt'
    terms: 'Int'
    updatedAt: 'DateTime'
  }
  Funding: { // field return type name
    accounstInvestor: 'AccountBond'
    accountManager: 'AccountBond'
    artist: 'Artist'
    artworks: 'Artwork'
    bondPrice: 'BigInt'
    bondsRemaining: 'BigInt'
    bondsTotalNumber: 'BigInt'
    contract: 'Contract'
    createdAt: 'DateTime'
    id: 'Int'
    status: 'FundingStatus'
    title: 'String'
    updatedAt: 'DateTime'
  }
  Mutation: { // field return type name
    emailAuthentication: 'String'
    fundingSettlement: 'Funding'
    participateFunding: 'AccountBond'
    signin: 'AuthPayload'
    signup: 'AuthPayload'
  }
  Query: { // field return type name
    artist: 'Artist'
    artists: 'Artist'
    artwork: 'Artwork'
    artworks: 'Artwork'
    balanceCash: 'BigInt'
    emailCheck: 'Auth'
    funding: 'Funding'
    fundings: 'Funding'
    myFundings: 'Funding'
    transactionsBond: 'TransactionBond'
    transactionsCash: 'TransactionCash'
    user: 'User'
    verificationCode: 'Boolean'
  }
  TransactionBond: { // field return type name
    account: 'AccountBond'
    amount: 'BigInt'
    createdAt: 'DateTime'
    id: 'Int'
    title: 'String'
    type: 'TransactionType'
    updatedAt: 'DateTime'
  }
  TransactionCash: { // field return type name
    account: 'AccountCash'
    amount: 'BigInt'
    createdAt: 'DateTime'
    id: 'Int'
    title: 'String'
    type: 'TransactionType'
    updatedAt: 'DateTime'
  }
  TransactionSettlement: { // field return type name
    account: 'AccountBond'
    additionalSettleMentAmount: 'BigInt'
    createdAt: 'DateTime'
    id: 'Int'
    round: 'Int'
    settlementAmount: 'BigInt'
    updatedAt: 'DateTime'
  }
  User: { // field return type name
    accountCash: 'AccountCash'
    accountsBond: 'AccountBond'
    auth: 'Auth'
    createdAt: 'DateTime'
    email: 'String'
    id: 'Int'
    name: 'String'
    role: 'Role'
    updatedAt: 'DateTime'
  }
}

export interface NexusGenArgTypes {
  Mutation: {
    emailAuthentication: { // args
      email: string; // String!
    }
    fundingSettlement: { // args
      amount: number; // Int!
      id: number; // Int!
    }
    participateFunding: { // args
      amount: number; // Int!
      id: number; // Int!
    }
    signin: { // args
      email: string; // String!
      password: string; // String!
    }
    signup: { // args
      email: string; // String!
      password: string; // String!
    }
  }
  Query: {
    artist: { // args
      id: number; // Int!
    }
    artists: { // args
      skip?: number | null; // Int
      take?: number | null; // Int
    }
    artwork: { // args
      id: number; // Int!
    }
    artworks: { // args
      id: number; // Int!
    }
    emailCheck: { // args
      email: string; // String!
    }
    funding: { // args
      id: number; // Int!
    }
    fundings: { // args
      skip?: number | null; // Int
      take?: number | null; // Int
    }
    myFundings: { // args
      skip?: number | null; // Int
      take?: number | null; // Int
    }
    transactionsBond: { // args
      ids?: Array<number | null> | null; // [Int]
      skip?: number | null; // Int
      take?: number | null; // Int
      type?: NexusGenEnums['TransactionType'] | null; // TransactionType
    }
    transactionsCash: { // args
      skip?: number | null; // Int
      take?: number | null; // Int
      type?: NexusGenEnums['TransactionType'] | null; // TransactionType
    }
    user: { // args
      email?: string | null; // String
      id?: number | null; // Int
    }
    verificationCode: { // args
      email: string; // String!
      verificationCode: string; // String!
    }
  }
}

export interface NexusGenAbstractTypeMembers {
}

export interface NexusGenTypeInterfaces {
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = never;

export type NexusGenEnumNames = keyof NexusGenEnums;

export type NexusGenInterfaceNames = never;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = never;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType = never;

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    isTypeOf: false
    resolveType: true
    __typename: false
  }
}

export interface NexusGenTypes {
  context: Context;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  fieldTypeNames: NexusGenFieldTypeNames;
  allTypes: NexusGenAllTypes;
  typeInterfaces: NexusGenTypeInterfaces;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}


declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginInputTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginSchemaConfig {
  }
  interface NexusGenPluginArgConfig {
  }
}