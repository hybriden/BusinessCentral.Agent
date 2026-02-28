import type { EntityDefinition } from "../entity-types.js";

export const customerEntity: EntityDefinition = {
  name: "customer",
  pluralName: "customers",
  apiPath: "customers",
  description:
    "Represents a customer in Business Central. Customers are parties that purchase goods or services from the company.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the customer.",
    },
    {
      name: "number",
      type: "string",
      description:
        "The customer number. Auto-generated if not specified on creation.",
      maxLength: 20,
    },
    {
      name: "displayName",
      type: "string",
      required: true,
      description: "The customer display name.",
      maxLength: 100,
    },
    {
      name: "type",
      type: "enum",
      description: "The type of the customer (Company or Person).",
      enumValues: ["Company", "Person"],
    },
    {
      name: "addressLine1",
      type: "string",
      description: "The first line of the customer address.",
      maxLength: 100,
    },
    {
      name: "addressLine2",
      type: "string",
      description: "The second line of the customer address.",
      maxLength: 50,
    },
    {
      name: "city",
      type: "string",
      description: "The city of the customer address.",
      maxLength: 30,
    },
    {
      name: "state",
      type: "string",
      description: "The state or province of the customer address.",
      maxLength: 30,
    },
    {
      name: "country",
      type: "string",
      description: "The country/region code of the customer address.",
      maxLength: 10,
    },
    {
      name: "postalCode",
      type: "string",
      description: "The postal or ZIP code of the customer address.",
      maxLength: 20,
    },
    {
      name: "phoneNumber",
      type: "string",
      description: "The phone number of the customer.",
      maxLength: 30,
    },
    {
      name: "email",
      type: "string",
      description: "The email address of the customer.",
      maxLength: 80,
    },
    {
      name: "website",
      type: "string",
      description: "The website URL of the customer.",
      maxLength: 80,
    },
    {
      name: "salespersonCode",
      type: "string",
      description: "The code of the salesperson assigned to the customer.",
      maxLength: 20,
    },
    {
      name: "balanceDue",
      type: "decimal",
      readOnly: true,
      description:
        "The total balance due from the customer. Calculated from outstanding ledger entries.",
    },
    {
      name: "creditLimit",
      type: "decimal",
      description: "The credit limit for the customer.",
    },
    {
      name: "taxLiable",
      type: "boolean",
      description: "Whether the customer is tax liable.",
    },
    {
      name: "taxAreaId",
      type: "guid",
      description: "The unique identifier of the tax area for the customer.",
    },
    {
      name: "taxAreaDisplayName",
      type: "string",
      readOnly: true,
      description: "The display name of the tax area for the customer.",
    },
    {
      name: "taxRegistrationNumber",
      type: "string",
      description:
        "The tax registration number (VAT registration number) of the customer.",
      maxLength: 20,
    },
    {
      name: "currencyId",
      type: "guid",
      description:
        "The unique identifier of the currency used for the customer.",
    },
    {
      name: "currencyCode",
      type: "string",
      description:
        "The code of the default currency for the customer (e.g. USD, EUR).",
      maxLength: 10,
    },
    {
      name: "paymentTermsId",
      type: "guid",
      description: "The unique identifier of the payment terms for the customer.",
    },
    {
      name: "shipmentMethodId",
      type: "guid",
      description:
        "The unique identifier of the shipment method for the customer.",
    },
    {
      name: "paymentMethodId",
      type: "guid",
      description:
        "The unique identifier of the payment method for the customer.",
    },
    {
      name: "blocked",
      type: "enum",
      description:
        "Specifies which transactions with the customer are blocked. Blank means not blocked.",
      enumValues: [" ", "Ship", "Invoice", "All"],
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description:
        "The date and time the customer was last modified.",
    },
  ],
  navigationProperties: [
    {
      name: "currency",
      targetEntity: "currency",
      isCollection: false,
      description: "The default currency for the customer.",
    },
    {
      name: "paymentTerm",
      targetEntity: "paymentTerm",
      isCollection: false,
      description: "The payment terms for the customer.",
    },
    {
      name: "shipmentMethod",
      targetEntity: "shipmentMethod",
      isCollection: false,
      description: "The shipment method for the customer.",
    },
    {
      name: "paymentMethod",
      targetEntity: "paymentMethod",
      isCollection: false,
      description: "The payment method for the customer.",
    },
    {
      name: "customerFinancialDetail",
      targetEntity: "customerFinancialDetail",
      isCollection: false,
      description: "The financial details of the customer.",
    },
    {
      name: "picture",
      targetEntity: "picture",
      isCollection: false,
      description: "The picture associated with the customer.",
    },
    {
      name: "defaultDimensions",
      targetEntity: "defaultDimension",
      isCollection: true,
      description: "The default dimensions for the customer.",
    },
    {
      name: "agedAccountsReceivable",
      targetEntity: "agedAccountsReceivable",
      isCollection: false,
      description: "The aged accounts receivable for the customer.",
    },
    {
      name: "contactsInformation",
      targetEntity: "contactInformation",
      isCollection: true,
      description: "The contact information entries for the customer.",
    },
  ],
  boundActions: [],
};
