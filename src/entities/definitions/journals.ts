import type { EntityDefinition } from "../entity-types.js";

export const journalEntity: EntityDefinition = {
  name: "journal",
  pluralName: "journals",
  apiPath: "journals",
  description:
    "Represents a general journal in Business Central. Journals are used to post financial transactions directly to general ledger accounts.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the journal.",
    },
    {
      name: "code",
      type: "string",
      description: "The code of the journal.",
      maxLength: 10,
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the journal.",
      maxLength: 80,
    },
    {
      name: "balancingAccountId",
      type: "guid",
      description:
        "The unique identifier of the balancing account for the journal.",
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
      description: "The date and time the journal was last modified.",
    },
  ],
  navigationProperties: [
    {
      name: "journalLines",
      targetEntity: "journalLine",
      isCollection: true,
      description: "The journal lines in this journal.",
    },
    {
      name: "account",
      targetEntity: "account",
      isCollection: false,
      description: "The balancing G/L account for the journal.",
    },
  ],
  boundActions: [
    {
      name: "post",
      description:
        "Posts all journal lines in the journal. This creates ledger entries for all lines.",
      httpMethod: "POST",
      navPath: "Microsoft.NAV.post",
    },
  ],
};
