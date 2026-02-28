import type { EntityDefinition } from "../entity-types.js";

export const dimensionValueEntity: EntityDefinition = {
  name: "dimensionValue",
  pluralName: "dimensionValues",
  apiPath: "dimensionValues",
  description:
    "Represents a dimension value in Business Central. Dimension values are the specific values available for a dimension (e.g. 'Sales' for the DEPARTMENT dimension).",
  isReadOnly: true,
  parentEntity: "dimension",
  parentNavigationProperty: "dimensionValues",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the dimension value.",
    },
    {
      name: "code",
      type: "string",
      readOnly: true,
      description: "The code of the dimension value.",
    },
    {
      name: "dimensionId",
      type: "guid",
      readOnly: true,
      description: "The unique identifier of the parent dimension.",
    },
    {
      name: "displayName",
      type: "string",
      readOnly: true,
      description: "The display name of the dimension value.",
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the dimension value was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
