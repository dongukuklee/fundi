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
  CreatorInvestmentPoint: { // input type
    status: string; // String!
    title: string; // String!
  }
}

export interface NexusGenEnums {
  ContractTypes: "LOANS" | "OWENERSHIP_TRANSFER"
  FundingStatus: "CAMPAIGNING" | "EARLY_CLOSING" | "END" | "FAILED_CAMPAIGN" | "POST_CAMPAIGN" | "PRE_CAMPAIGN"
  QnAStatus: "AWAITING_RESPONSE" | "RESPONDED"
  QnATypes: "ETC" | "INVESTMENT" | "SETTLEMENT"
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
  Auth: { // root type
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    email: string; // String!
    id: number; // Int!
    name?: string | null; // String
    pincode?: string | null; // String
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  AuthPayload: { // root type
    token: string; // String!
    user: NexusGenRootTypes['User']; // User!
  }
  Biography: { // root type
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    description: string; // String!
    id: number; // Int!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
    year: number; // Int!
  }
  Contract: { // root type
    amountRecieved: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    endDate: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    lastYearEarning: NexusGenScalars['BigInt']; // BigInt!
    startDate: NexusGenScalars['DateTime']; // DateTime!
    terms: number; // Int!
    type: NexusGenEnums['ContractTypes']; // ContractTypes!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Creator: { // root type
    age?: number | null; // Int
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    description: string; // String!
    id: number; // Int!
    name: string; // String!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Funding: { // root type
    bondPrice: NexusGenScalars['BigInt']; // BigInt!
    bondsTotalNumber: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    endDate?: NexusGenScalars['DateTime'] | null; // DateTime
    id: number; // Int!
    remainingBonds: NexusGenScalars['BigInt']; // BigInt!
    startDate?: NexusGenScalars['DateTime'] | null; // DateTime
    status: NexusGenEnums['FundingStatus']; // FundingStatus!
    title: string; // String!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  IDVerification: { // root type
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    phoneNumber?: string | null; // String
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Mutation: {};
  Notice: { // root type
    content?: string | null; // String
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    title?: string | null; // String
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  QnA: { // root type
    content?: string | null; // String
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    reply?: string | null; // String
    title?: string | null; // String
    type: NexusGenEnums['QnATypes']; // QnATypes!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
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
    accumulatedCash: NexusGenScalars['BigInt']; // BigInt!
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
  WithdrawalAccount: { // root type
    accountNumber: string; // String!
    bankCode: number; // Int!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
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
    investmentAmount: NexusGenScalars['BigInt'] | null; // BigInt
    owner: NexusGenRootTypes['User'] | null; // User
    settlementAmount: Array<NexusGenScalars['BigInt'] | null> | null; // [BigInt]
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
  Auth: { // field return type
    IDVerification: NexusGenRootTypes['IDVerification'] | null; // IDVerification
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    email: string; // String!
    id: number; // Int!
    name: string | null; // String
    pincode: string | null; // String
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
    user: NexusGenRootTypes['User'] | null; // User
    withdrawalAccount: NexusGenRootTypes['WithdrawalAccount'] | null; // WithdrawalAccount
  }
  AuthPayload: { // field return type
    token: string; // String!
    user: NexusGenRootTypes['User']; // User!
  }
  Biography: { // field return type
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    description: string; // String!
    id: number; // Int!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
    year: number; // Int!
  }
  Contract: { // field return type
    amountRecieved: NexusGenScalars['BigInt']; // BigInt!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    endDate: NexusGenScalars['DateTime']; // DateTime!
    funding: NexusGenRootTypes['Funding'] | null; // Funding
    id: number; // Int!
    lastYearEarning: NexusGenScalars['BigInt']; // BigInt!
    startDate: NexusGenScalars['DateTime']; // DateTime!
    terms: number; // Int!
    type: NexusGenEnums['ContractTypes']; // ContractTypes!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Creator: { // field return type
    age: number | null; // Int
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    description: string; // String!
    fundings: NexusGenRootTypes['Funding'][]; // [Funding!]!
    id: number; // Int!
    isLikedUser: boolean | null; // Boolean
    likedUser: Array<NexusGenRootTypes['User'] | null> | null; // [User]
    name: string; // String!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Funding: { // field return type
    accountInvestor: NexusGenRootTypes['AccountBond'][]; // [AccountBond!]!
    accountManager: NexusGenRootTypes['AccountBond'] | null; // AccountBond
    bondPrice: NexusGenScalars['BigInt']; // BigInt!
    bondsTotalNumber: NexusGenScalars['BigInt']; // BigInt!
    contract: NexusGenRootTypes['Contract'] | null; // Contract
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    creator: Array<NexusGenRootTypes['Creator'] | null> | null; // [Creator]
    endDate: NexusGenScalars['DateTime'] | null; // DateTime
    id: number; // Int!
    isLikedUser: boolean | null; // Boolean
    likedUser: Array<NexusGenRootTypes['User'] | null> | null; // [User]
    remainingBonds: NexusGenScalars['BigInt']; // BigInt!
    startDate: NexusGenScalars['DateTime'] | null; // DateTime
    status: NexusGenEnums['FundingStatus']; // FundingStatus!
    title: string; // String!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  IDVerification: { // field return type
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    phoneNumber: string | null; // String
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  Mutation: { // field return type
    IDVerification: NexusGenRootTypes['Auth'] | null; // Auth
    chargeTheDeposit: NexusGenRootTypes['AccountCash'] | null; // AccountCash
    createCreator: NexusGenRootTypes['Creator'] | null; // Creator
    createFunding: NexusGenRootTypes['Funding'] | null; // Funding
    createNotice: NexusGenRootTypes['Notice'] | null; // Notice
    createPincode: string | null; // String
    createQnA: NexusGenRootTypes['QnA'] | null; // QnA
    emailAuthentication: boolean | null; // Boolean
    fundingSettlement: NexusGenRootTypes['Funding'] | null; // Funding
    likeCreator: NexusGenRootTypes['Creator'] | null; // Creator
    likeFunding: NexusGenRootTypes['Funding'] | null; // Funding
    participateFunding: NexusGenRootTypes['AccountBond'] | null; // AccountBond
    registerWithdrawalAccount: NexusGenRootTypes['Auth'] | null; // Auth
    replyQueation: NexusGenRootTypes['QnA'] | null; // QnA
    signin: NexusGenRootTypes['AuthPayload']; // AuthPayload!
    signup: NexusGenRootTypes['AuthPayload']; // AuthPayload!
    updateCreator: NexusGenRootTypes['Creator'] | null; // Creator
    updateFunding: NexusGenRootTypes['Funding'] | null; // Funding
    updateNotice: NexusGenRootTypes['Notice'] | null; // Notice
    updatePincode: string | null; // String
    updateQuestion: NexusGenRootTypes['QnA'] | null; // QnA
    updateUserPassword: string | null; // String
    withdrawFunding: NexusGenRootTypes['AccountBond'] | null; // AccountBond
  }
  Notice: { // field return type
    content: string | null; // String
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    title: string | null; // String
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  QnA: { // field return type
    content: string | null; // String
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    reply: string | null; // String
    title: string | null; // String
    type: NexusGenEnums['QnATypes']; // QnATypes!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
    user: NexusGenRootTypes['User'] | null; // User
  }
  Query: { // field return type
    QnAs: Array<NexusGenRootTypes['QnA'] | null> | null; // [QnA]
    balanceCash: NexusGenScalars['BigInt'] | null; // BigInt
    checkPincode: boolean | null; // Boolean
    creator: NexusGenRootTypes['Creator'] | null; // Creator
    creators: NexusGenRootTypes['Creator'][]; // [Creator!]!
    funding: NexusGenRootTypes['Funding'] | null; // Funding
    fundings: NexusGenRootTypes['Funding'][]; // [Funding!]!
    myFundings: NexusGenRootTypes['Funding'][]; // [Funding!]!
    myQnA: Array<NexusGenRootTypes['QnA'] | null> | null; // [QnA]
    notice: NexusGenRootTypes['Notice'] | null; // Notice
    notices: Array<NexusGenRootTypes['Notice'] | null> | null; // [Notice]
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
    accumulatedCash: NexusGenScalars['BigInt']; // BigInt!
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
    favoriteCreators: Array<NexusGenRootTypes['Creator'] | null> | null; // [Creator]
    favoriteFundings: Array<NexusGenRootTypes['Funding'] | null> | null; // [Funding]
    id: number; // Int!
    name: string | null; // String
    role: NexusGenEnums['Role']; // Role!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
  WithdrawalAccount: { // field return type
    accountNumber: string; // String!
    bankCode: number; // Int!
    createdAt: NexusGenScalars['DateTime']; // DateTime!
    id: number; // Int!
    updatedAt: NexusGenScalars['DateTime']; // DateTime!
  }
}

export interface NexusGenFieldTypeNames {
  AccountBond: { // field return type name
    balance: 'BigInt'
    createdAt: 'DateTime'
    funding: 'Funding'
    id: 'Int'
    investmentAmount: 'BigInt'
    owner: 'User'
    settlementAmount: 'BigInt'
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
  Auth: { // field return type name
    IDVerification: 'IDVerification'
    createdAt: 'DateTime'
    email: 'String'
    id: 'Int'
    name: 'String'
    pincode: 'String'
    updatedAt: 'DateTime'
    user: 'User'
    withdrawalAccount: 'WithdrawalAccount'
  }
  AuthPayload: { // field return type name
    token: 'String'
    user: 'User'
  }
  Biography: { // field return type name
    createdAt: 'DateTime'
    description: 'String'
    id: 'Int'
    updatedAt: 'DateTime'
    year: 'Int'
  }
  Contract: { // field return type name
    amountRecieved: 'BigInt'
    createdAt: 'DateTime'
    endDate: 'DateTime'
    funding: 'Funding'
    id: 'Int'
    lastYearEarning: 'BigInt'
    startDate: 'DateTime'
    terms: 'Int'
    type: 'ContractTypes'
    updatedAt: 'DateTime'
  }
  Creator: { // field return type name
    age: 'Int'
    createdAt: 'DateTime'
    description: 'String'
    fundings: 'Funding'
    id: 'Int'
    isLikedUser: 'Boolean'
    likedUser: 'User'
    name: 'String'
    updatedAt: 'DateTime'
  }
  Funding: { // field return type name
    accountInvestor: 'AccountBond'
    accountManager: 'AccountBond'
    bondPrice: 'BigInt'
    bondsTotalNumber: 'BigInt'
    contract: 'Contract'
    createdAt: 'DateTime'
    creator: 'Creator'
    endDate: 'DateTime'
    id: 'Int'
    isLikedUser: 'Boolean'
    likedUser: 'User'
    remainingBonds: 'BigInt'
    startDate: 'DateTime'
    status: 'FundingStatus'
    title: 'String'
    updatedAt: 'DateTime'
  }
  IDVerification: { // field return type name
    createdAt: 'DateTime'
    id: 'Int'
    phoneNumber: 'String'
    updatedAt: 'DateTime'
  }
  Mutation: { // field return type name
    IDVerification: 'Auth'
    chargeTheDeposit: 'AccountCash'
    createCreator: 'Creator'
    createFunding: 'Funding'
    createNotice: 'Notice'
    createPincode: 'String'
    createQnA: 'QnA'
    emailAuthentication: 'Boolean'
    fundingSettlement: 'Funding'
    likeCreator: 'Creator'
    likeFunding: 'Funding'
    participateFunding: 'AccountBond'
    registerWithdrawalAccount: 'Auth'
    replyQueation: 'QnA'
    signin: 'AuthPayload'
    signup: 'AuthPayload'
    updateCreator: 'Creator'
    updateFunding: 'Funding'
    updateNotice: 'Notice'
    updatePincode: 'String'
    updateQuestion: 'QnA'
    updateUserPassword: 'String'
    withdrawFunding: 'AccountBond'
  }
  Notice: { // field return type name
    content: 'String'
    createdAt: 'DateTime'
    id: 'Int'
    title: 'String'
    updatedAt: 'DateTime'
  }
  QnA: { // field return type name
    content: 'String'
    createdAt: 'DateTime'
    id: 'Int'
    reply: 'String'
    title: 'String'
    type: 'QnATypes'
    updatedAt: 'DateTime'
    user: 'User'
  }
  Query: { // field return type name
    QnAs: 'QnA'
    balanceCash: 'BigInt'
    checkPincode: 'Boolean'
    creator: 'Creator'
    creators: 'Creator'
    funding: 'Funding'
    fundings: 'Funding'
    myFundings: 'Funding'
    myQnA: 'QnA'
    notice: 'Notice'
    notices: 'Notice'
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
    accumulatedCash: 'BigInt'
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
    favoriteCreators: 'Creator'
    favoriteFundings: 'Funding'
    id: 'Int'
    name: 'String'
    role: 'Role'
    updatedAt: 'DateTime'
  }
  WithdrawalAccount: { // field return type name
    accountNumber: 'String'
    bankCode: 'Int'
    createdAt: 'DateTime'
    id: 'Int'
    updatedAt: 'DateTime'
  }
}

export interface NexusGenArgTypes {
  Mutation: {
    IDVerification: { // args
      phoneNumber: string; // String!
    }
    chargeTheDeposit: { // args
      amount: number; // Int!
    }
    createCreator: { // args
      age: number; // Int!
      name: string; // String!
    }
    createFunding: { // args
      bondPrice: number | null; // Int
      bondsTotalNumber: number | null; // Int
      intro?: string | null; // String
      title: string; // String!
    }
    createNotice: { // args
      content: string; // String!
      title: string; // String!
    }
    createPincode: { // args
      pincode: string; // String!
    }
    createQnA: { // args
      content: string; // String!
      title: string; // String!
      type: NexusGenEnums['QnATypes']; // QnATypes!
    }
    emailAuthentication: { // args
      email: string; // String!
    }
    fundingSettlement: { // args
      amount: number; // Int!
      id: number; // Int!
    }
    likeCreator: { // args
      id: number; // Int!
    }
    likeFunding: { // args
      id: number; // Int!
    }
    participateFunding: { // args
      amount: number; // Int!
      id: number; // Int!
    }
    registerWithdrawalAccount: { // args
      accountNumber: string; // String!
      bankCode: number; // Int!
    }
    replyQueation: { // args
      id: number; // Int!
      reply: string; // String!
    }
    signin: { // args
      email: string; // String!
      password: string; // String!
    }
    signup: { // args
      email: string; // String!
      password: string; // String!
    }
    updateCreator: { // args
      age?: number | null; // Int
      biography?: string | null; // String
      id: number; // Int!
      investmentPoint?: NexusGenInputs['CreatorInvestmentPoint'][] | null; // [CreatorInvestmentPoint!]
      name?: string | null; // String
    }
    updateFunding: { // args
      bondPrice: number | null; // Int
      bondsTotalNumber: number | null; // Int
      id: number; // Int!
      intro?: string | null; // String
      status?: NexusGenEnums['FundingStatus'] | null; // FundingStatus
      title?: string | null; // String
    }
    updateNotice: { // args
      content?: string | null; // String
      id: number; // Int!
      title?: string | null; // String
    }
    updatePincode: { // args
      followingPincode: string; // String!
      previousPincode: string; // String!
    }
    updateQuestion: { // args
      content?: string | null; // String
      id: number; // Int!
      title?: string | null; // String
      type?: NexusGenEnums['QnATypes'] | null; // QnATypes
    }
    updateUserPassword: { // args
      password: string; // String!
    }
    withdrawFunding: { // args
      id: number; // Int!
    }
  }
  Query: {
    checkPincode: { // args
      pincode: string; // String!
    }
    creator: { // args
      id: number; // Int!
    }
    creators: { // args
      skip?: number | null; // Int
      sort?: string | null; // String
      take?: number | null; // Int
    }
    funding: { // args
      id: number; // Int!
    }
    fundings: { // args
      skip?: number | null; // Int
      sort?: string | null; // String
      status?: NexusGenEnums['FundingStatus'] | null; // FundingStatus
      take?: number | null; // Int
    }
    myFundings: { // args
      skip?: number | null; // Int
      take?: number | null; // Int
    }
    notice: { // args
      id: number; // Int!
    }
    notices: { // args
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

export type NexusGenInputNames = keyof NexusGenInputs;

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