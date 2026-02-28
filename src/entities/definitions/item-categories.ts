import type { EntityDefinition } from "../entity-types.js";

export const itemCategoryEntity: EntityDefinition = {
  name: "itemCategory",
  pluralName: "itemCategories",
  apiPath: "itemCategories",
  description:
    "Represents an item category in Business Central. Item categories are used to group items for reporting and analysis.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the item category.",
    },
    {
      name: "code",
      type: "string",
      description: "The code of the item category.",
      maxLength: 20,
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the item category.",
      maxLength: 100,
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the item category was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
