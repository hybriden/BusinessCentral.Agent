import type { EntityDefinition } from "../entity-types.js";

export const paymentMethodEntity: EntityDefinition = {
  name: "paymentMethod",
  pluralName: "paymentMethods",
  apiPath: "paymentMethods",
  description:
    "Represents a payment method in Business Central. Payment methods define how payments are made (e.g. cash, check, bank transfer).",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the payment method.",
    },
    {
      name: "code",
      type: "string",
      description: "The code of the payment method.",
      maxLength: 10,
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the payment method.",
      maxLength: 50,
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the payment method was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
