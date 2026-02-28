import type { EntityDefinition } from "../entity-types.js";

export const paymentTermEntity: EntityDefinition = {
  name: "paymentTerm",
  pluralName: "paymentTerms",
  apiPath: "paymentTerms",
  description:
    "Represents payment terms in Business Central. Payment terms define when and how payment is due from customers or to vendors.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the payment term.",
    },
    {
      name: "code",
      type: "string",
      description:
        "The code of the payment term (e.g. NET30, 2/10NET30).",
      maxLength: 10,
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the payment term.",
      maxLength: 50,
    },
    {
      name: "dueDateCalculation",
      type: "string",
      description:
        "The date formula for calculating the due date (e.g. 30D for 30 days).",
      maxLength: 32,
    },
    {
      name: "discountDateCalculation",
      type: "string",
      description:
        "The date formula for calculating the discount date.",
      maxLength: 32,
    },
    {
      name: "discountPercent",
      type: "decimal",
      description: "The discount percentage if paid within the discount period.",
    },
    {
      name: "calculateDiscountOnCreditMemos",
      type: "boolean",
      description:
        "Whether to calculate the discount on credit memos.",
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the payment term was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
