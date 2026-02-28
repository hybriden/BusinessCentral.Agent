import type { EntityDefinition } from "../entity-types.js";

export const agedAccountsPayableEntity: EntityDefinition = {
  name: "agedAccountsPayable",
  pluralName: "agedAccountsPayable",
  apiPath: "agedAccountsPayable",
  description:
    "Represents aged accounts payable data in Business Central. Provides aging analysis of vendor balances, showing how long amounts have been outstanding.",
  isReadOnly: true,
  fields: [
    {
      name: "vendorId",
      type: "guid",
      readOnly: true,
      description: "The unique identifier of the vendor.",
    },
    {
      name: "vendorNumber",
      type: "string",
      readOnly: true,
      description: "The number of the vendor.",
    },
    {
      name: "name",
      type: "string",
      readOnly: true,
      description: "The name of the vendor.",
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
      description: "The total balance due to the vendor.",
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
