import type { EntityDefinition } from "../entity-types.js";

export const itemEntity: EntityDefinition = {
  name: "item",
  pluralName: "items",
  apiPath: "items",
  description:
    "Represents an item (product or service) in Business Central. Items are goods or services that are bought, sold, or consumed.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the item.",
    },
    {
      name: "number",
      type: "string",
      description:
        "The item number. Auto-generated if not specified on creation.",
      maxLength: 20,
    },
    {
      name: "displayName",
      type: "string",
      required: true,
      description: "The display name / description of the item.",
      maxLength: 100,
    },
    {
      name: "displayName2",
      type: "string",
      description: "The additional description of the item.",
      maxLength: 50,
    },
    {
      name: "type",
      type: "enum",
      description:
        "The type of the item: Inventory items are physical goods tracked in stock, Service items are non-physical labor or services, Non-Inventory items are physical goods not tracked in stock.",
      enumValues: ["Inventory", "Service", "Non-Inventory"],
    },
    {
      name: "itemCategoryId",
      type: "guid",
      description: "The unique identifier of the item category.",
    },
    {
      name: "itemCategoryCode",
      type: "string",
      description: "The code of the item category.",
      maxLength: 20,
    },
    {
      name: "blocked",
      type: "boolean",
      description:
        "Whether the item is blocked. A blocked item cannot be used in transactions.",
    },
    {
      name: "gtin",
      type: "string",
      description:
        "The Global Trade Item Number (barcode) for the item.",
      maxLength: 14,
    },
    {
      name: "inventory",
      type: "decimal",
      readOnly: true,
      description:
        "The current inventory quantity on hand. Calculated from item ledger entries.",
    },
    {
      name: "unitPrice",
      type: "decimal",
      description: "The default unit sales price of the item.",
    },
    {
      name: "priceIncludesTax",
      type: "boolean",
      description: "Whether the unit price includes tax (VAT).",
    },
    {
      name: "unitCost",
      type: "decimal",
      description: "The unit cost of the item.",
    },
    {
      name: "taxGroupId",
      type: "guid",
      description: "The unique identifier of the tax group for the item.",
    },
    {
      name: "taxGroupCode",
      type: "string",
      description: "The code of the tax group for the item.",
      maxLength: 20,
    },
    {
      name: "baseUnitOfMeasureId",
      type: "guid",
      description: "The unique identifier of the base unit of measure.",
    },
    {
      name: "baseUnitOfMeasureCode",
      type: "string",
      description:
        "The code of the base unit of measure for the item (e.g. PCS, KG).",
      maxLength: 10,
    },
    {
      name: "generalProductPostingGroupId",
      type: "guid",
      description:
        "The unique identifier of the general product posting group.",
    },
    {
      name: "generalProductPostingGroupCode",
      type: "string",
      description: "The code of the general product posting group.",
      maxLength: 20,
    },
    {
      name: "inventoryPostingGroupId",
      type: "guid",
      description: "The unique identifier of the inventory posting group.",
    },
    {
      name: "inventoryPostingGroupCode",
      type: "string",
      description: "The code of the inventory posting group.",
      maxLength: 20,
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the item was last modified.",
    },
  ],
  navigationProperties: [
    {
      name: "itemCategory",
      targetEntity: "itemCategory",
      isCollection: false,
      description: "The category of the item.",
    },
    {
      name: "unitOfMeasure",
      targetEntity: "unitOfMeasure",
      isCollection: false,
      description: "The base unit of measure for the item.",
    },
    {
      name: "picture",
      targetEntity: "picture",
      isCollection: false,
      description: "The picture associated with the item.",
    },
    {
      name: "defaultDimensions",
      targetEntity: "defaultDimension",
      isCollection: true,
      description: "The default dimensions for the item.",
    },
    {
      name: "itemVariants",
      targetEntity: "itemVariant",
      isCollection: true,
      description: "The variants of the item.",
    },
  ],
  boundActions: [],
};
