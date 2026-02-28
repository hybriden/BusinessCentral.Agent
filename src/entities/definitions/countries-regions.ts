import type { EntityDefinition } from "../entity-types.js";

export const countryRegionEntity: EntityDefinition = {
  name: "countryRegion",
  pluralName: "countriesRegions",
  apiPath: "countriesRegions",
  description:
    "Represents a country/region in Business Central. Countries/regions are used for address formatting and tax reporting.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the country/region.",
    },
    {
      name: "code",
      type: "string",
      description: "The ISO country/region code (e.g. US, GB, DE).",
      maxLength: 10,
    },
    {
      name: "displayName",
      type: "string",
      description: "The display name of the country/region.",
      maxLength: 50,
    },
    {
      name: "addressFormat",
      type: "string",
      description:
        "The address format used for the country/region.",
      maxLength: 100,
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description:
        "The date and time the country/region was last modified.",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};
