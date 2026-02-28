import type { EntityDefinition } from "../entity-types.js";

export const taxGroupEntity: EntityDefinition = {
  name: "taxGroup",
  pluralName: "taxGroups",
  apiPath: "taxGroups",
  description:
    "Represents a tax group in Business Central. Tax groups are used to group items and resources for tax calculation purposes.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the tax group.",
    },
    {
      name: "code",
      type: "string",
      description: "The code of the tax group.",
      maxLength: 20,
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the tax group.",
      maxLength: 100,
    },
    {
      name: "taxType",
      type: "string",
      description:
        "The tax type for the group (e.g. Sales Tax, VAT).",
      maxLength: 30,
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the tax group was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
