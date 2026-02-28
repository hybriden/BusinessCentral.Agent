import type { EntityDefinition } from "../entity-types.js";

export const employeeEntity: EntityDefinition = {
  name: "employee",
  pluralName: "employees",
  apiPath: "employees",
  description:
    "Represents an employee in Business Central. Employees are people who work for the company.",
  fields: [
    {
      name: "id",
      type: "guid",
      readOnly: true,
      description: "The unique identifier for the employee.",
    },
    {
      name: "number",
      type: "string",
      description:
        "The employee number. Auto-generated if not specified.",
      maxLength: 20,
    },
    {
      name: "displayName",
      type: "string",
      description: "The full display name of the employee.",
      maxLength: 100,
    },
    {
      name: "givenName",
      type: "string",
      description: "The given (first) name of the employee.",
      maxLength: 30,
    },
    {
      name: "middleName",
      type: "string",
      description: "The middle name of the employee.",
      maxLength: 30,
    },
    {
      name: "surname",
      type: "string",
      description: "The surname (last name) of the employee.",
      maxLength: 30,
    },
    {
      name: "jobTitle",
      type: "string",
      description: "The job title of the employee.",
      maxLength: 30,
    },
    {
      name: "addressLine1",
      type: "string",
      description: "The first line of the employee address.",
      maxLength: 100,
    },
    {
      name: "addressLine2",
      type: "string",
      description: "The second line of the employee address.",
      maxLength: 50,
    },
    {
      name: "city",
      type: "string",
      description: "The city of the employee address.",
      maxLength: 30,
    },
    {
      name: "state",
      type: "string",
      description: "The state of the employee address.",
      maxLength: 30,
    },
    {
      name: "country",
      type: "string",
      description: "The country/region code of the employee address.",
      maxLength: 10,
    },
    {
      name: "postalCode",
      type: "string",
      description: "The postal code of the employee address.",
      maxLength: 20,
    },
    {
      name: "phoneNumber",
      type: "string",
      description: "The phone number of the employee.",
      maxLength: 30,
    },
    {
      name: "mobilePhone",
      type: "string",
      description: "The mobile phone number of the employee.",
      maxLength: 30,
    },
    {
      name: "email",
      type: "string",
      description: "The work email address of the employee.",
      maxLength: 80,
    },
    {
      name: "personalEmail",
      type: "string",
      description: "The personal email address of the employee.",
      maxLength: 80,
    },
    {
      name: "employmentDate",
      type: "date",
      description: "The date the employee started employment.",
    },
    {
      name: "terminationDate",
      type: "date",
      description:
        "The date the employee's employment was terminated, if applicable.",
    },
    {
      name: "status",
      type: "enum",
      description: "The employment status of the employee.",
      enumValues: ["Active", "Inactive"],
    },
    {
      name: "birthDate",
      type: "date",
      description: "The birth date of the employee.",
    },
    {
      name: "statisticsGroupCode",
      type: "string",
      description: "The statistics group code for the employee.",
      maxLength: 10,
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "The date and time the employee was last modified.",
    },
  ],
  navigationProperties: [
    {
      name: "picture",
      targetEntity: "picture",
      isCollection: false,
      description: "The picture of the employee.",
    },
    {
      name: "defaultDimensions",
      targetEntity: "defaultDimension",
      isCollection: true,
      description: "The default dimensions for the employee.",
    },
    {
      name: "timeRegistrationEntries",
      targetEntity: "timeRegistrationEntry",
      isCollection: true,
      description: "The time registration entries for the employee.",
    },
  ],
  boundActions: [],
};
