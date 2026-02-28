import type { EntityDefinition } from "../entity-types.js";

export const currencyEntity: EntityDefinition = {
  name: "currency",
  pluralName: "currencies",
  apiPath: "currencies",
  description:
    "Represents a currency in Business Central. Currencies define the monetary units used for transactions.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the currency.",
    },
    {
      name: "code",
      type: "string",
      description: "The ISO currency code (e.g. USD, EUR, GBP).",
      maxLength: 10,
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the currency.",
      maxLength: 30,
    },
    {
      name: "symbol",
      type: "string",
      description: "The symbol of the currency (e.g. $, EUR).",
      maxLength: 10,
    },
    {
      name: "amountDecimalPlaces",
      type: "string",
      description:
        "The number of decimal places for amounts in this currency.",
      maxLength: 5,
    },
    {
      name: "amountRoundingPrecision",
      type: "decimal",
      description: "The rounding precision for amounts in this currency.",
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the currency was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
