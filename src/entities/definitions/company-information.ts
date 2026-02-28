import type { EntityDefinition } from "../entity-types.js";

export const companyInformationEntity: EntityDefinition = {
  name: "companyInformation",
  pluralName: "companyInformation",
  apiPath: "companyInformation",
  description:
    "Represents the company information in Business Central. Contains the company's name, address, contact details, and other identification data.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the company information.",
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the company.",
      maxLength: 100,
    },
    {
      name: "addressLine1",
      type: "string",
      description: "The first line of the company address.",
      maxLength: 100,
    },
    {
      name: "addressLine2",
      type: "string",
      description: "The second line of the company address.",
      maxLength: 50,
    },
    {
      name: "city",
      type: "string",
      description: "The city of the company address.",
      maxLength: 30,
    },
    {
      name: "state",
      type: "string",
      description: "The state of the company address.",
      maxLength: 30,
    },
    {
      name: "country",
      type: "string",
      description: "The country/region code of the company address.",
      maxLength: 10,
    },
    {
      name: "postalCode",
      type: "string",
      description: "The postal code of the company address.",
      maxLength: 20,
    },
    {
      name: "phoneNumber",
      type: "string",
      description: "The phone number of the company.",
      maxLength: 30,
    },
    {
      name: "faxNumber",
      type: "string",
      description: "The fax number of the company.",
      maxLength: 30,
    },
    {
      name: "email",
      type: "string",
      description: "The email address of the company.",
      maxLength: 80,
    },
    {
      name: "website",
      type: "string",
      description: "The website URL of the company.",
      maxLength: 80,
    },
    {
      name: "taxRegistrationNumber",
      type: "string",
      description:
        "The tax registration number (VAT number) of the company.",
      maxLength: 20,
    },
    {
      name: "currencyCode",
      type: "string",
      description: "The local currency code of the company.",
      maxLength: 10,
    },
    {
      name: "currentFiscalYearStartDate",
      type: "date",
      description: "The start date of the current fiscal year.",
    },
    {
      name: "industry",
      type: "string",
      description: "The industry the company operates in.",
      maxLength: 30,
    },
    {
      name: "picture",
      type: "string",
      description: "The company logo/picture as a base64 encoded string.",
    },
    {
      name: "businessProfileId",
      type: "string",
      description: "The business profile identifier.",
      maxLength: 50,
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the company information was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
