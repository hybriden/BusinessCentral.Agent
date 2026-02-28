import type { EntityDefinition } from "../entity-types.js";

export const bankAccountEntity: EntityDefinition = {
  name: "bankAccount",
  pluralName: "bankAccounts",
  apiPath: "bankAccounts",
  description:
    "Represents a bank account in Business Central. Bank accounts are used to track the company's bank balances and transactions.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the bank account.",
    },
    {
      name: "number",
      type: "string",
      description: "The bank account number identifier in Business Central.",
      maxLength: 20,
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the bank account.",
      maxLength: 100,
    },
    {
      name: "bankAccountNumber",
      type: "string",
      description: "The actual bank account number at the financial institution.",
      maxLength: 30,
    },
    {
      name: "blocked",
      type: "boolean",
      description:
        "Whether the bank account is blocked. Blocked bank accounts cannot be used in transactions.",
    },
    {
      name: "currencyCode",
      type: "string",
      description: "The currency code of the bank account.",
      maxLength: 10,
    },
    {
      name: "iban",
      type: "string",
      description:
        "The International Bank Account Number (IBAN) of the bank account.",
      maxLength: 50,
    },
    {
      name: "intercompanyEnabled",
      type: "boolean",
      description:
        "Whether the bank account is enabled for intercompany transactions.",
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the bank account was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
