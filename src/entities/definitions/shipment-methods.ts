import type { EntityDefinition } from "../entity-types.js";

export const shipmentMethodEntity: EntityDefinition = {
  name: "shipmentMethod",
  pluralName: "shipmentMethods",
  apiPath: "shipmentMethods",
  description:
    "Represents a shipment method in Business Central. Shipment methods define how goods are shipped to customers (e.g. FOB, CIF).",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the shipment method.",
    },
    {
      name: "code",
      type: "string",
      description: "The code of the shipment method.",
      maxLength: 10,
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the shipment method.",
      maxLength: 50,
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the shipment method was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
