import type { EntityDefinition } from "../entity-types.js";

export const salesInvoiceEntity: EntityDefinition = {
  name: "salesInvoice",
  pluralName: "salesInvoices",
  apiPath: "salesInvoices",
  description:
    "Represents a sales invoice in Business Central. Sales invoices are used to bill customers for goods and services sold.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the sales invoice.",
    },
    {
      name: "number",
      type: "string",
      description:
        "The sales invoice number. Auto-generated if not specified.",
      maxLength: 20,
    },
    {
      name: "externalDocumentNumber",
      type: "string",
      description:
        "The external document number, such as the customer's purchase order number.",
      maxLength: 35,
    },
    {
      name: "invoiceDate",
      type: "date",
      description: "The date of the sales invoice.",
    },
    {
      name: "postingDate",
      type: "date",
      description: "The date the sales invoice will be posted.",
    },
    {
      name: "dueDate",
      type: "date",
      description: "The date the payment is due.",
    },
    {
      name: "promisedPayDate",
      type: "date",
      description: "The date the customer promised to pay.",
    },
    {
      name: "customerPurchaseOrderReference",
      type: "string",
      description: "The customer's purchase order reference.",
      maxLength: 35,
    },
    {
      name: "customerId",
      type: "guid",
      description: "The unique identifier of the customer.",
    },
    {
      name: "customerNumber",
      type: "string",
      description: "The number of the customer.",
      maxLength: 20,
    },
    {
      name: "customerName",
      type: "string",
      description: "The name of the customer.",
      maxLength: 100,
    },
    {
      name: "billToName",
      type: "string",
      description: "The bill-to name.",
      maxLength: 100,
    },
    {
      name: "billToCustomerId",
      type: "guid",
      description: "The unique identifier of the bill-to customer.",
    },
    {
      name: "billToCustomerNumber",
      type: "string",
      description: "The number of the bill-to customer.",
      maxLength: 20,
    },
    {
      name: "shipToName",
      type: "string",
      description: "The ship-to name.",
      maxLength: 100,
    },
    {
      name: "shipToContact",
      type: "string",
      description: "The ship-to contact person.",
      maxLength: 100,
    },
    {
      name: "sellToAddressLine1",
      type: "string",
      description: "The first line of the sell-to address.",
      maxLength: 100,
    },
    {
      name: "sellToAddressLine2",
      type: "string",
      description: "The second line of the sell-to address.",
      maxLength: 50,
    },
    {
      name: "sellToCity",
      type: "string",
      description: "The city of the sell-to address.",
      maxLength: 30,
    },
    {
      name: "sellToCountry",
      type: "string",
      description: "The country/region code of the sell-to address.",
      maxLength: 10,
    },
    {
      name: "sellToState",
      type: "string",
      description: "The state of the sell-to address.",
      maxLength: 30,
    },
    {
      name: "sellToPostCode",
      type: "string",
      description: "The postal code of the sell-to address.",
      maxLength: 20,
    },
    {
      name: "billToAddressLine1",
      type: "string",
      description: "The first line of the bill-to address.",
      maxLength: 100,
    },
    {
      name: "billToAddressLine2",
      type: "string",
      description: "The second line of the bill-to address.",
      maxLength: 50,
    },
    {
      name: "billToCity",
      type: "string",
      description: "The city of the bill-to address.",
      maxLength: 30,
    },
    {
      name: "billToCountry",
      type: "string",
      description: "The country/region code of the bill-to address.",
      maxLength: 10,
    },
    {
      name: "billToState",
      type: "string",
      description: "The state of the bill-to address.",
      maxLength: 30,
    },
    {
      name: "billToPostCode",
      type: "string",
      description: "The postal code of the bill-to address.",
      maxLength: 20,
    },
    {
      name: "shipToAddressLine1",
      type: "string",
      description: "The first line of the ship-to address.",
      maxLength: 100,
    },
    {
      name: "shipToAddressLine2",
      type: "string",
      description: "The second line of the ship-to address.",
      maxLength: 50,
    },
    {
      name: "shipToCity",
      type: "string",
      description: "The city of the ship-to address.",
      maxLength: 30,
    },
    {
      name: "shipToCountry",
      type: "string",
      description: "The country/region code of the ship-to address.",
      maxLength: 10,
    },
    {
      name: "shipToState",
      type: "string",
      description: "The state of the ship-to address.",
      maxLength: 30,
    },
    {
      name: "shipToPostCode",
      type: "string",
      description: "The postal code of the ship-to address.",
      maxLength: 20,
    },
    {
      name: "shortcutDimension1Code",
      type: "string",
      description: "The code of the first shortcut dimension.",
      maxLength: 20,
    },
    {
      name: "shortcutDimension2Code",
      type: "string",
      description: "The code of the second shortcut dimension.",
      maxLength: 20,
    },
    {
      name: "currencyId",
      type: "guid",
      description: "The unique identifier of the currency.",
    },
    {
      name: "currencyCode",
      type: "string",
      description: "The currency code for the invoice.",
      maxLength: 10,
    },
    {
      name: "orderId",
      type: "guid",
      readOnly: true,
      description:
        "The unique identifier of the sales order this invoice was created from, if any.",
    },
    {
      name: "orderNumber",
      type: "string",
      readOnly: true,
      description:
        "The number of the sales order this invoice was created from, if any.",
      maxLength: 20,
    },
    {
      name: "pricesIncludeTax",
      type: "boolean",
      readOnly: true,
      description: "Whether prices on the invoice include tax.",
    },
    {
      name: "paymentTermsId",
      type: "guid",
      description: "The unique identifier of the payment terms.",
    },
    {
      name: "shipmentMethodId",
      type: "guid",
      description: "The unique identifier of the shipment method.",
    },
    {
      name: "salesperson",
      type: "string",
      description: "The salesperson code assigned to the invoice.",
      maxLength: 20,
    },
    {
      name: "discountAmount",
      type: "decimal",
      description: "The invoice discount amount.",
    },
    {
      name: "discountAppliedBeforeTax",
      type: "boolean",
      description: "Whether the discount is applied before tax.",
    },
    {
      name: "totalAmountExcludingTax",
      type: "decimal",
      readOnly: true,
      description: "The total amount of the invoice excluding tax.",
    },
    {
      name: "totalTaxAmount",
      type: "decimal",
      readOnly: true,
      description: "The total tax amount for the invoice.",
    },
    {
      name: "totalAmountIncludingTax",
      type: "decimal",
      readOnly: true,
      description: "The total amount of the invoice including tax.",
    },
    {
      name: "remainingAmount",
      type: "decimal",
      readOnly: true,
      description:
        "The remaining amount to be paid on the invoice.",
    },
    {
      name: "disputeStatusId",
      type: "guid",
      description: "The unique identifier of the dispute status.",
    },
    {
      name: "disputeStatus",
      type: "string",
      description: "The dispute status of the invoice.",
      maxLength: 50,
    },
    {
      name: "status",
      type: "enum",
      description: "The status of the sales invoice.",
      enumValues: [" ", "Draft", "In Review", "Open", "Paid", "Canceled", "Corrective"],
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description:
        "The date and time the sales invoice was last modified.",
    },
    {
      name: "phoneNumber",
      type: "string",
      description: "The phone number associated with the invoice.",
      maxLength: 30,
    },
    {
      name: "email",
      type: "string",
      description: "The email address associated with the invoice.",
      maxLength: 80,
    },
  ],
  navigationProperties: [
    {
      name: "customer",
      targetEntity: "customer",
      isCollection: false,
      description: "The customer for the sales invoice.",
    },
    {
      name: "currency",
      targetEntity: "currency",
      isCollection: false,
      description: "The currency for the sales invoice.",
    },
    {
      name: "paymentTerm",
      targetEntity: "paymentTerm",
      isCollection: false,
      description: "The payment terms for the sales invoice.",
    },
    {
      name: "shipmentMethod",
      targetEntity: "shipmentMethod",
      isCollection: false,
      description: "The shipment method for the sales invoice.",
    },
    {
      name: "salesInvoiceLines",
      targetEntity: "salesInvoiceLine",
      isCollection: true,
      description: "The line items of the sales invoice.",
    },
    {
      name: "dimensionSetLines",
      targetEntity: "dimensionSetLine",
      isCollection: true,
      description: "The dimension set lines for the sales invoice.",
    },
    {
      name: "pdfDocument",
      targetEntity: "pdfDocument",
      isCollection: false,
      description: "The PDF document for the sales invoice.",
    },
    {
      name: "attachments",
      targetEntity: "attachment",
      isCollection: true,
      description: "The file attachments for the sales invoice.",
    },
  ],
  boundActions: [
    {
      name: "post",
      description:
        "Posts the sales invoice. This creates a posted sales invoice and associated ledger entries.",
      httpMethod: "POST",
      navPath: "Microsoft.NAV.post",
    },
    {
      name: "postAndSend",
      description:
        "Posts the sales invoice and sends it to the customer via email.",
      httpMethod: "POST",
      navPath: "Microsoft.NAV.postAndSend",
    },
    {
      name: "send",
      description:
        "Sends the sales invoice to the customer via email.",
      httpMethod: "POST",
      navPath: "Microsoft.NAV.send",
    },
    {
      name: "cancel",
      description:
        "Cancels the posted sales invoice by creating a corrective credit memo.",
      httpMethod: "POST",
      navPath: "Microsoft.NAV.cancel",
    },
    {
      name: "cancelAndSend",
      description:
        "Cancels the posted sales invoice and sends the cancellation to the customer.",
      httpMethod: "POST",
      navPath: "Microsoft.NAV.cancelAndSend",
    },
    {
      name: "makeCorrectiveCreditMemo",
      description:
        "Creates a corrective credit memo for the posted sales invoice.",
      httpMethod: "POST",
      navPath: "Microsoft.NAV.makeCorrectiveCreditMemo",
    },
  ],
};
