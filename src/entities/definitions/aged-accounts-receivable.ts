import type { EntityDefinition } from "../entity-types.js";

export const agedAccountsReceivableEntity: EntityDefinition = {
  name: "agedAccountsReceivable",
  pluralName: "agedAccountsReceivable",
  apiPath: "agedAccountsReceivable",
  description:
    "Represents aged accounts receivable data in Business Central. Provides aging analysis of customer balances, showing how long amounts have been outstanding.",
  isReadOnly: true,
  fields: [
    {
      name: "customerId",
      type: "guid",
      readOnly: true,
      description: "The unique identifier of the customer.",
    },
    {
      name: "customerNumber",
      type: "string",
      readOnly: true,
      description: "The number of the customer.",
    },
    {
      name: "name",
      type: "string",
      readOnly: true,
      description: "The name of the customer.",
    },
    {
      name: "currencyCode",
      type: "string",
      readOnly: true,
      description: "The currency code for the amounts.",
    },
    {
      name: "balanceDue",
      type: "decimal",
      readOnly: true,
      description: "The total balance due from the customer.",
    },
    {
      name: "currentAmount",
      type: "decimal",
      readOnly: true,
      description: "The amount that is current (not yet due).",
    },
    {
      name: "period1Amount",
      type: "decimal",
      readOnly: true,
      description: "The amount in the first aging period.",
    },
    {
      name: "period2Amount",
      type: "decimal",
      readOnly: true,
      description: "The amount in the second aging period.",
    },
    {
      name: "period3Amount",
      type: "decimal",
      readOnly: true,
      description: "The amount in the third aging period (oldest).",
    },
    {
      name: "agedAsOfDate",
      type: "date",
      readOnly: true,
      description: "The date the aging was calculated as of.",
    },
    {
      name: "periodLengthFilter",
      type: "string",
      readOnly: true,
      description:
        "The date formula defining the length of each aging period (e.g. 30D for 30-day periods).",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
