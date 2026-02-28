import type { EntityDefinition } from "../entity-types.js";

export const salesOrderLineEntity: EntityDefinition = {
  name: "salesOrderLine",
  pluralName: "salesOrderLines",
  apiPath: "salesOrderLines",
  description:
    "Represents a line item on a sales order in Business Central. Each line specifies an item, account, or charge being sold.",
  parentEntity: "salesOrder",
  parentNavigationProperty: "salesOrderLines",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the sales order line.",
    },
    {
      name: "documentId",
      type: "guid",
      description: "The unique identifier of the parent sales order.",
    },
    {
      name: "sequence",
      type: "number",
      description: "The sequence number of the line.",
    },
    {
      name: "itemId",
      type: "guid",
      description:
        "The unique identifier of the item on the line. Used when lineType is Item.",
    },
    {
      name: "accountId",
      type: "guid",
      description:
        "The unique identifier of the account on the line. Used when lineType is Account.",
    },
    {
      name: "lineType",
      type: "enum",
      description:
        "The type of the sales order line.",
      enumValues: ["Comment", "Account", "Item", "Resource", "Fixed Asset", "Charge"],
    },
    {
      name: "lineObjectNumber",
      type: "string",
      description:
        "The number of the item or account on the line.",
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
      description: "The unique identifier of the unit of measure for the line.",
    },
    {
      name: "unitOfMeasureCode",
      type: "string",
      description: "The code of the unit of measure for the line.",
      maxLength: 10,
    },
    {
      name: "quantity",
      type: "decimal",
      description: "The quantity of the item or service on the line.",
    },
    {
      name: "unitPrice",
      type: "decimal",
      description: "The unit price of the item or service.",
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
      description: "Whether the discount is applied before tax calculation.",
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
      description:
        "The invoice discount amount allocated to this line.",
    },
    {
      name: "netAmount",
      type: "decimal",
      readOnly: true,
      description:
        "The net amount of the line after all discounts.",
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
      description: "The net amount of the line including tax.",
    },
    {
      name: "shipmentDate",
      type: "date",
      description: "The planned shipment date for the line.",
    },
    {
      name: "shippedQuantity",
      type: "decimal",
      readOnly: true,
      description: "The quantity already shipped for this line.",
    },
    {
      name: "invoicedQuantity",
      type: "decimal",
      readOnly: true,
      description: "The quantity already invoiced for this line.",
    },
    {
      name: "invoiceQuantity",
      type: "decimal",
      description: "The quantity to invoice.",
    },
    {
      name: "shipQuantity",
      type: "decimal",
      description: "The quantity to ship.",
    },
    {
      name: "itemVariantId",
      type: "guid",
      description: "The unique identifier of the item variant.",
    },
    {
      name: "locationId",
      type: "guid",
      description: "The unique identifier of the location for the line.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
