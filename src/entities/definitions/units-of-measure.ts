import type { EntityDefinition } from "../entity-types.js";

export const unitOfMeasureEntity: EntityDefinition = {
  name: "unitOfMeasure",
  pluralName: "unitsOfMeasure",
  apiPath: "unitsOfMeasure",
  description:
    "Represents a unit of measure in Business Central. Units of measure define how items are quantified (e.g. pieces, kilograms, hours).",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the unit of measure.",
    },
    {
      name: "code",
      type: "string",
      description: "The code of the unit of measure (e.g. PCS, KG, HR).",
      maxLength: 10,
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the unit of measure.",
      maxLength: 50,
    },
    {
      name: "internationalStandardCode",
      type: "string",
      description:
        "The international standard code (UN/CEFACT) for the unit of measure.",
      maxLength: 10,
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the unit of measure was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
