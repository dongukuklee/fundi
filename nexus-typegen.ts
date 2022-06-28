/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */


import type { Context } from "./src/context"
import type { core } from "nexus"
declare global {
  interface NexusGenCustomInputMethods<TypeName extends string> {
    /**
     * Date custom scalar type
     */
    dateTime<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // "dateTime";
  }
}
declare global {
  interface NexusGenCustomOutputMethods<TypeName extends string> {
    /**
     * Date custom scalar type
     */
    dateTime<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "dateTime";
  }
}


declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
}

export interface NexusGenEnums {
  Role: "ADMIN" | "INVESTOR" | "MANAGER"
}

export interface NexusGenScalars {
  String: string
  Int: number
  Float: number
  Boolean: boolean
  ID: string
  dateTime: any
}

export interface NexusGenObjects {
  AccountCash: { // root type
    balance: number; // Int!
    createdAt: NexusGenScalars['dateTime']; // dateTime!
    id: number; // Int!
    owner: NexusGenRootTypes['User']; // User!
    ownerId: number; // Int!
    updatedAt: NexusGenScalars['dateTime']; // dateTime!
  }
  AccountFunding: { // root type
    balance: number; // Int!
    createdAt: NexusGenScalars['dateTime']; // dateTime!
    funding: NexusGenRootTypes['Funding']; // Funding!
    fundingId: number; // Int!
    id: number; // Int!
    owner: NexusGenRootTypes['User']; // User!
    ownerId: number; // Int!
    updatedAt: NexusGenScalars['dateTime']; // dateTime!
  }
  Auth: { // root type
    createdAt: NexusGenScalars['dateTime']; // dateTime!
    email: string; // String!
    id: number; // Int!
    name: string; // String!
    password: string; // String!
    updatedAt: NexusGenScalars['dateTime']; // dateTime!
    user: NexusGenRootTypes['User']; // User!
    userId: number; // Int!
  }
  Funding: { // root type
    bondPrice: number; // Int!
    bondTotalNumber: number; // Int!
    createdAt: NexusGenScalars['dateTime']; // dateTime!
    id: number; // Int!
    title: string; // String!
    updatedAt: NexusGenScalars['dateTime']; // dateTime!
  }
  Mutation: {};
  Query: {};
  User: { // root type
    accountCash: NexusGenRootTypes['AccountCash']; // AccountCash!
    accountFunding?: Array<NexusGenRootTypes['AccountFunding'] | null> | null; // [AccountFunding]
    auth: NexusGenRootTypes['Auth']; // Auth!
    createdAt: NexusGenScalars['dateTime']; // dateTime!
    id: number; // Int!
    role: NexusGenEnums['Role']; // Role!
    updatedAt: NexusGenScalars['dateTime']; // dateTime!
  }
}

export interface NexusGenInterfaces {
}

export interface NexusGenUnions {
}

export type NexusGenRootTypes = NexusGenObjects

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars & NexusGenEnums

export interface NexusGenFieldTypes {
  AccountCash: { // field return type
    balance: number; // Int!
    createdAt: NexusGenScalars['dateTime']; // dateTime!
    id: number; // Int!
    owner: NexusGenRootTypes['User']; // User!
    ownerId: number; // Int!
    updatedAt: NexusGenScalars['dateTime']; // dateTime!
  }
  AccountFunding: { // field return type
    balance: number; // Int!
    createdAt: NexusGenScalars['dateTime']; // dateTime!
    funding: NexusGenRootTypes['Funding']; // Funding!
    fundingId: number; // Int!
    id: number; // Int!
    owner: NexusGenRootTypes['User']; // User!
    ownerId: number; // Int!
    updatedAt: NexusGenScalars['dateTime']; // dateTime!
  }
  Auth: { // field return type
    createdAt: NexusGenScalars['dateTime']; // dateTime!
    email: string; // String!
    id: number; // Int!
    name: string; // String!
    password: string; // String!
    updatedAt: NexusGenScalars['dateTime']; // dateTime!
    user: NexusGenRootTypes['User']; // User!
    userId: number; // Int!
  }
  Funding: { // field return type
    bondPrice: number; // Int!
    bondTotalNumber: number; // Int!
    createdAt: NexusGenScalars['dateTime']; // dateTime!
    id: number; // Int!
    title: string; // String!
    updatedAt: NexusGenScalars['dateTime']; // dateTime!
  }
  Mutation: { // field return type
    createUser: NexusGenRootTypes['User'] | null; // User
  }
  Query: { // field return type
    user: NexusGenRootTypes['User']; // User!
    users: NexusGenRootTypes['User'][]; // [User!]!
  }
  User: { // field return type
    accountCash: NexusGenRootTypes['AccountCash']; // AccountCash!
    accountFunding: Array<NexusGenRootTypes['AccountFunding'] | null> | null; // [AccountFunding]
    auth: NexusGenRootTypes['Auth']; // Auth!
    createdAt: NexusGenScalars['dateTime']; // dateTime!
    id: number; // Int!
    role: NexusGenEnums['Role']; // Role!
    updatedAt: NexusGenScalars['dateTime']; // dateTime!
  }
}

export interface NexusGenFieldTypeNames {
  AccountCash: { // field return type name
    balance: 'Int'
    createdAt: 'dateTime'
    id: 'Int'
    owner: 'User'
    ownerId: 'Int'
    updatedAt: 'dateTime'
  }
  AccountFunding: { // field return type name
    balance: 'Int'
    createdAt: 'dateTime'
    funding: 'Funding'
    fundingId: 'Int'
    id: 'Int'
    owner: 'User'
    ownerId: 'Int'
    updatedAt: 'dateTime'
  }
  Auth: { // field return type name
    createdAt: 'dateTime'
    email: 'String'
    id: 'Int'
    name: 'String'
    password: 'String'
    updatedAt: 'dateTime'
    user: 'User'
    userId: 'Int'
  }
  Funding: { // field return type name
    bondPrice: 'Int'
    bondTotalNumber: 'Int'
    createdAt: 'dateTime'
    id: 'Int'
    title: 'String'
    updatedAt: 'dateTime'
  }
  Mutation: { // field return type name
    createUser: 'User'
  }
  Query: { // field return type name
    user: 'User'
    users: 'User'
  }
  User: { // field return type name
    accountCash: 'AccountCash'
    accountFunding: 'AccountFunding'
    auth: 'Auth'
    createdAt: 'dateTime'
    id: 'Int'
    role: 'Role'
    updatedAt: 'dateTime'
  }
}

export interface NexusGenArgTypes {
  Mutation: {
    createUser: { // args
      email: string; // String!
      name: string; // String!
      password: string; // String!
      role: string; // String!
    }
  }
  Query: {
    user: { // args
      id: number; // Int!
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