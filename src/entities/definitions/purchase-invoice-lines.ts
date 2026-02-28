import type { EntityDefinition } from "../entity-types.js";

export const purchaseInvoiceLineEntity: EntityDefinition = {
  name: "purchaseInvoiceLine",
  pluralName: "purchaseInvoiceLines",
  apiPath: "purchaseInvoiceLines",
  description:
    "Represents a line item on a purchase invoice in Business Central.",
  parentEntity: "purchaseInvoice",
  parentNavigationProperty: "purchaseInvoiceLines",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the purchase invoice line.",
    },
    {
      name: "documentId",
      type: "guid",
      description: "The unique identifier of the parent purchase invoice.",
    },
    {
      name: "sequence",
      type: "number",
      description: "The sequence number of the line.",
    },
    {
      name: "itemId",
      type: "guid",
      description: "The unique identifier of the item. Used when lineType is Item.",
    },
    {
      name: "accountId",
      type: "guid",
      description: "The unique identifier of the account. Used when lineType is Account.",
    },
    {
      name: "lineType",
      type: "enum",
      description: "The type of the purchase invoice line.",
      enumValues: ["Comment", "Account", "Item", "Resource", "Fixed Asset", "Charge"],
    },
    {
      name: "lineObjectNumber",
      type: "string",
      description: "The number of the item or account on the line.",
      maxLength: 20,
    },
    {
      name: "description",
      type: "string",
      description: "The description of the line item.",
      maxLength: 100,
    },
    {
      name: "unitOfMeasureId",
      type: "guid",
      description: "The unique identifier of the unit of measure.",
    },
    {
      name: "unitOfMeasureCode",
      type: "string",
      description: "The code of the unit of measure.",
      maxLength: 10,
    },
    {
      name: "quantity",
      type: "decimal",
      description: "The quantity of the item or service.",
    },
    {
      name: "directUnitCost",
      type: "decimal",
      description: "The direct unit cost of the item or service.",
    },
    {
      name: "discountAmount",
      type: "decimal",
      description: "The line discount amount.",
    },
    {
      name: "discountPercent",
      type: "decimal",
      description: "The line discount percentage.",
    },
    {
      name: "discountAppliedBeforeTax",
      type: "boolean",
      description: "Whether the discount is applied before tax.",
    },
    {
      name: "amountExcludingTax",
      type: "decimal",
      description: "The line amount excluding tax.",
    },
    {
      name: "taxCode",
      type: "string",
      description: "The tax code for the line.",
      maxLength: 20,
    },
    {
      name: "taxPercent",
      type: "decimal",
      description: "The tax percentage for the line.",
    },
    {
      name: "totalTaxAmount",
      type: "decimal",
      readOnly: true,
      description: "The total tax amount for the line.",
    },
    {
      name: "amountIncludingTax",
      type: "decimal",
      description: "The line amount including tax.",
    },
    {
      name: "invoiceDiscountAllocation",
      type: "decimal",
      readOnly: true,
      description: "The invoice discount allocated to this line.",
    },
    {
      name: "netAmount",
      type: "decimal",
      readOnly: true,
      description: "The net amount after all discounts.",
    },
    {
      name: "netTaxAmount",
      type: "decimal",
      readOnly: true,
      description: "The net tax amount for the line.",
    },
    {
      name: "netAmountIncludingTax",
      type: "decimal",
      readOnly: true,
      description: "The net amount including tax.",
    },
    {
      name: "expectedReceiptDate",
      type: "date",
      description: "The expected receipt date for the line.",
    },
    {
      name: "itemVariantId",
      type: "guid",
      description: "The unique identifier of the item variant.",
    },
    {
      name: "locationId",
      type: "guid",
      description: "The unique identifier of the location.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
