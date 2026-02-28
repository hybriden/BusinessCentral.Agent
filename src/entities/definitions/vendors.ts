import type { EntityDefinition } from "../entity-types.js";

export const vendorEntity: EntityDefinition = {
  name: "vendor",
  pluralName: "vendors",
  apiPath: "vendors",
  description:
    "Represents a vendor in Business Central. Vendors are parties from which the company purchases goods or services.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the vendor.",
    },
    {
      name: "number",
      type: "string",
      description:
        "The vendor number. Auto-generated if not specified on creation.",
      maxLength: 20,
    },
    {
      name: "displayName",
      type: "string",
      required: true,
      description: "The vendor display name.",
      maxLength: 100,
    },
    {
      name: "addressLine1",
      type: "string",
      description: "The first line of the vendor address.",
      maxLength: 100,
    },
    {
      name: "addressLine2",
      type: "string",
      description: "The second line of the vendor address.",
      maxLength: 50,
    },
    {
      name: "city",
      type: "string",
      description: "The city of the vendor address.",
      maxLength: 30,
    },
    {
      name: "state",
      type: "string",
      description: "The state or province of the vendor address.",
      maxLength: 30,
    },
    {
      name: "country",
      type: "string",
      description: "The country/region code of the vendor address.",
      maxLength: 10,
    },
    {
      name: "postalCode",
      type: "string",
      description: "The postal or ZIP code of the vendor address.",
      maxLength: 20,
    },
    {
      name: "phoneNumber",
      type: "string",
      description: "The phone number of the vendor.",
      maxLength: 30,
    },
    {
      name: "email",
      type: "string",
      description: "The email address of the vendor.",
      maxLength: 80,
    },
    {
      name: "website",
      type: "string",
      description: "The website URL of the vendor.",
      maxLength: 80,
    },
    {
      name: "taxRegistrationNumber",
      type: "string",
      description:
        "The tax registration number (VAT registration number) of the vendor.",
      maxLength: 20,
    },
    {
      name: "currencyId",
      type: "guid",
      description:
        "The unique identifier of the currency used for the vendor.",
    },
    {
      name: "currencyCode",
      type: "string",
      description:
        "The code of the default currency for the vendor (e.g. USD, EUR).",
      maxLength: 10,
    },
    {
      name: "paymentTermsId",
      type: "guid",
      description: "The unique identifier of the payment terms for the vendor.",
    },
    {
      name: "paymentMethodId",
      type: "guid",
      description:
        "The unique identifier of the payment method for the vendor.",
    },
    {
      name: "taxLiable",
      type: "boolean",
      description: "Whether the vendor is tax liable.",
    },
    {
      name: "blocked",
      type: "enum",
      description:
        "Specifies which transactions with the vendor are blocked. Blank means not blocked.",
      enumValues: [" ", "Payment", "All"],
    },
    {
      name: "balance",
      type: "decimal",
      readOnly: true,
      description:
        "The total balance owed to the vendor. Calculated from outstanding ledger entries.",
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the vendor was last modified.",
    },
  ],
  navigationProperties: [
    {
      name: "currency",
      targetEntity: "currency",
      isCollection: false,
      description: "The default currency for the vendor.",
    },
    {
      name: "paymentTerm",
      targetEntity: "paymentTerm",
      isCollection: false,
      description: "The payment terms for the vendor.",
    },
    {
      name: "paymentMethod",
      targetEntity: "paymentMethod",
      isCollection: false,
      description: "The payment method for the vendor.",
    },
    {
      name: "picture",
      targetEntity: "picture",
      isCollection: false,
      description: "The picture associated with the vendor.",
    },
    {
      name: "defaultDimensions",
      targetEntity: "defaultDimension",
      isCollection: true,
      description: "The default dimensions for the vendor.",
    },
  ],
  boundActions: [],
};
