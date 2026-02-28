import type { EntityDefinition } from "../entity-types.js";

export const journalLineEntity: EntityDefinition = {
  name: "journalLine",
  pluralName: "journalLines",
  apiPath: "journalLines",
  description:
    "Represents a journal line in Business Central. Journal lines specify individual financial transactions within a journal.",
  parentEntity: "journal",
  parentNavigationProperty: "journalLines",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the journal line.",
    },
    {
      name: "journalId",
      type: "guid",
      description: "The unique identifier of the parent journal.",
    },
    {
      name: "journalDisplayName",
      type: "string",
      readOnly: true,
      description: "The display name of the parent journal.",
    },
    {
      name: "lineNumber",
      type: "number",
      description: "The line number of the journal line.",
    },
    {
      name: "accountType",
      type: "enum",
      description: "The type of account for the journal line.",
      enumValues: [
        "G/L Account",
        "Customer",
        "Vendor",
        "Bank Account",
        "Fixed Asset",
        "IC Partner",
        "Employee",
      ],
    },
    {
      name: "accountId",
      type: "guid",
      description: "The unique identifier of the account.",
    },
    {
      name: "accountNumber",
      type: "string",
      description: "The number of the account.",
      maxLength: 20,
    },
    {
      name: "postingDate",
      type: "date",
      description: "The posting date for the journal line.",
    },
    {
      name: "documentNumber",
      type: "string",
      description: "The document number for the journal line.",
      maxLength: 20,
    },
    {
      name: "externalDocumentNumber",
      type: "string",
      description: "The external document number.",
      maxLength: 35,
    },
    {
      name: "amount",
      type: "decimal",
      description:
        "The amount for the journal line. Positive values represent debits, negative values represent credits.",
    },
    {
      name: "description",
      type: "string",
      description: "The description of the journal line.",
      maxLength: 100,
    },
    {
      name: "comment",
      type: "string",
      description: "A comment for the journal line.",
      maxLength: 250,
    },
    {
      name: "taxCode",
      type: "string",
      description: "The tax code for the journal line.",
      maxLength: 20,
    },
    {
      name: "balanceAccountType",
      type: "enum",
      description: "The type of the balancing account.",
      enumValues: [
        "G/L Account",
        "Customer",
        "Vendor",
        "Bank Account",
        "Fixed Asset",
        "IC Partner",
        "Employee",
      ],
    },
    {
      name: "balancingAccountId",
      type: "guid",
      description: "The unique identifier of the balancing account.",
    },
    {
      name: "balancingAccountNumber",
      type: "string",
      description: "The number of the balancing account.",
      maxLength: 20,
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the journal line was last modified.",
    },
  ],
  navigationProperties: [
    {
      name: "account",
      targetEntity: "account",
      isCollection: false,
      description: "The G/L account for the journal line.",
    },
    {
      name: "attachments",
      targetEntity: "attachment",
      isCollection: true,
      description: "The file attachments for the journal line.",
    },
    {
      name: "dimensionSetLines",
      targetEntity: "dimensionSetLine",
      isCollection: true,
      description: "The dimension set lines for the journal line.",
    },
  ],
  boundActions: [],
};
