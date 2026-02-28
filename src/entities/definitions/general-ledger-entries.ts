import type { EntityDefinition } from "../entity-types.js";

export const generalLedgerEntryEntity: EntityDefinition = {
  name: "generalLedgerEntry",
  pluralName: "generalLedgerEntries",
  apiPath: "generalLedgerEntries",
  description:
    "Represents a general ledger entry in Business Central. GL entries are the core financial records created when transactions are posted.",
  isReadOnly: true,
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the general ledger entry.",
    },
    {
      name: "entryNumber",
      type: "number",
      readOnly: true,
      description: "The sequential entry number of the GL entry.",
    },
    {
      name: "postingDate",
      type: "date",
      readOnly: true,
      description: "The posting date of the GL entry.",
    },
    {
      name: "documentNumber",
      type: "string",
      readOnly: true,
      description: "The document number associated with the GL entry.",
    },
    {
      name: "documentType",
      type: "string",
      readOnly: true,
      description:
        "The type of document that created the GL entry (e.g. Invoice, Payment, Credit Memo).",
    },
    {
      name: "accountId",
      type: "guid",
      readOnly: true,
      description: "The unique identifier of the G/L account.",
    },
    {
      name: "accountNumber",
      type: "string",
      readOnly: true,
      description: "The number of the G/L account.",
    },
    {
      name: "description",
      type: "string",
      readOnly: true,
      description: "The description of the GL entry.",
    },
    {
      name: "debitAmount",
      type: "decimal",
      readOnly: true,
      description: "The debit amount of the GL entry.",
    },
    {
      name: "creditAmount",
      type: "decimal",
      readOnly: true,
      description: "The credit amount of the GL entry.",
    },
    {
      name: "additionalCurrencyDebitAmount",
      type: "decimal",
      readOnly: true,
      description: "The debit amount in the additional reporting currency.",
    },
    {
      name: "additionalCurrencyCreditAmount",
      type: "decimal",
      readOnly: true,
      description: "The credit amount in the additional reporting currency.",
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the GL entry was last modified.",
    },
  ],
  navigationProperties: [
    {
      name: "dimensionSetLines",
      targetEntity: "dimensionSetLine",
      isCollection: true,
      description: "The dimension set lines for the GL entry.",
    },
    {
      name: "account",
      targetEntity: "account",
      isCollection: false,
      description: "The G/L account for the entry.",
    },
  ],
  boundActions: [],
};
