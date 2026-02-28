import type { EntityDefinition } from "../entity-types.js";

export const accountEntity: EntityDefinition = {
  name: "account",
  pluralName: "accounts",
  apiPath: "accounts",
  description:
    "Represents a general ledger (G/L) account in Business Central. Accounts are used in the chart of accounts for financial reporting and posting.",
  isReadOnly: true,
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the account.",
    },
    {
      name: "number",
      type: "string",
      readOnly: true,
      description: "The account number in the chart of accounts.",
    },
    {
      name: "displayName",
      type: "string",
      readOnly: true,
      description: "The display name of the account.",
    },
    {
      name: "category",
      type: "string",
      readOnly: true,
      description:
        "The account category (e.g. Assets, Liabilities, Equity, Income, Cost of Goods Sold, Expense).",
    },
    {
      name: "subCategory",
      type: "string",
      readOnly: true,
      description: "The account sub-category for more detailed classification.",
    },
    {
      name: "blocked",
      type: "boolean",
      readOnly: true,
      description:
        "Whether the account is blocked. Blocked accounts cannot be used for posting.",
    },
    {
      name: "accountType",
      type: "enum",
      readOnly: true,
      description:
        "The type of account. Only Posting accounts can have entries posted to them.",
      enumValues: ["Posting", "Heading", "Total", "Begin-Total", "End-Total"],
    },
    {
      name: "directPosting",
      type: "boolean",
      readOnly: true,
      description:
        "Whether direct posting is allowed to this account from journal lines.",
    },
    {
      name: "netChange",
      type: "decimal",
      readOnly: true,
      description: "The net change of the account for the current period.",
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the account was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
