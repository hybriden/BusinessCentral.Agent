import type { EntityDefinition } from "../entity-types.js";

export const dimensionEntity: EntityDefinition = {
  name: "dimension",
  pluralName: "dimensions",
  apiPath: "dimensions",
  description:
    "Represents a dimension in Business Central. Dimensions are used to categorize and analyze transactions by attributes such as department, project, or location.",
  isReadOnly: true,
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the dimension.",
    },
    {
      name: "code",
      type: "string",
      readOnly: true,
      description: "The code of the dimension (e.g. DEPARTMENT, PROJECT).",
    },
    {
      name: "displayName",
      type: "string",
      readOnly: true,
      description: "The display name of the dimension.",
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the dimension was last modified.",
    },
  ],
  navigationProperties: [
    {
      name: "dimensionValues",
      targetEntity: "dimensionValue",
      isCollection: true,
      description: "The available values for this dimension.",
    },
  ],
  boundActions: [],
};
