import type { EntityDefinition } from "../entity-types.js";

export const contactEntity: EntityDefinition = {
  name: "contact",
  pluralName: "contacts",
  apiPath: "contacts",
  description:
    "Represents a contact in Business Central. Contacts are people or companies with whom the business has a relationship.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the contact.",
    },
    {
      name: "number",
      type: "string",
      description: "The contact number.",
      maxLength: 20,
    },
    {
      name: "type",
      type: "enum",
      description: "The type of the contact.",
      enumValues: ["Company", "Person"],
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the contact.",
      maxLength: 100,
    },
    {
      name: "companyName",
      type: "string",
      description:
        "The company name associated with the contact. For person contacts, this is the company they belong to.",
      maxLength: 100,
    },
    {
      name: "companyNumber",
      type: "string",
      description: "The company contact number.",
      maxLength: 20,
    },
    {
      name: "businessRelation",
      type: "string",
      description:
        "The business relation of the contact (e.g. Customer, Vendor, Bank).",
      maxLength: 10,
    },
    {
      name: "addressLine1",
      type: "string",
      description: "The first line of the contact address.",
      maxLength: 100,
    },
    {
      name: "addressLine2",
      type: "string",
      description: "The second line of the contact address.",
      maxLength: 50,
    },
    {
      name: "city",
      type: "string",
      description: "The city of the contact address.",
      maxLength: 30,
    },
    {
      name: "state",
      type: "string",
      description: "The state of the contact address.",
      maxLength: 30,
    },
    {
      name: "country",
      type: "string",
      description: "The country/region code of the contact address.",
      maxLength: 10,
    },
    {
      name: "postalCode",
      type: "string",
      description: "The postal code of the contact address.",
      maxLength: 20,
    },
    {
      name: "phoneNumber",
      type: "string",
      description: "The phone number of the contact.",
      maxLength: 30,
    },
    {
      name: "mobilePhoneNumber",
      type: "string",
      description: "The mobile phone number of the contact.",
      maxLength: 30,
    },
    {
      name: "email",
      type: "string",
      description: "The email address of the contact.",
      maxLength: 80,
    },
    {
      name: "website",
      type: "string",
      description: "The website URL of the contact.",
      maxLength: 80,
    },
    {
      name: "searchName",
      type: "string",
      description: "The search name used for finding the contact.",
      maxLength: 100,
    },
    {
      name: "privacyBlocked",
      type: "boolean",
      description:
        "Whether the contact is privacy blocked due to GDPR or similar regulations.",
    },
    {
      name: "lastInteractionDate",
      type: "date",
      readOnly: true,
      description: "The date of the last interaction with the contact.",
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the contact was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
