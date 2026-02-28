import type { EntityDefinition } from "../entity-types.js";

// Core entities
export { customerEntity } from "./customers.js";
export { vendorEntity } from "./vendors.js";
export { itemEntity } from "./items.js";

// Sales documents
export { salesOrderEntity } from "./sales-orders.js";
export { salesOrderLineEntity } from "./sales-order-lines.js";
export { salesInvoiceEntity } from "./sales-invoices.js";
export { salesInvoiceLineEntity } from "./sales-invoice-lines.js";
export { salesQuoteEntity } from "./sales-quotes.js";
export { salesQuoteLineEntity } from "./sales-quote-lines.js";
export { salesCreditMemoEntity } from "./sales-credit-memos.js";
export { salesCreditMemoLineEntity } from "./sales-credit-memo-lines.js";

// Purchase documents
export { purchaseOrderEntity } from "./purchase-orders.js";
export { purchaseOrderLineEntity } from "./purchase-order-lines.js";
export { purchaseInvoiceEntity } from "./purchase-invoices.js";
export { purchaseInvoiceLineEntity } from "./purchase-invoice-lines.js";

// Finance
export { generalLedgerEntryEntity } from "./general-ledger-entries.js";
export { journalEntity } from "./journals.js";
export { journalLineEntity } from "./journal-lines.js";
export { accountEntity } from "./accounts.js";
export { dimensionEntity } from "./dimensions.js";
export { dimensionValueEntity } from "./dimension-values.js";

// Setup / Reference
export { employeeEntity } from "./employees.js";
export { currencyEntity } from "./currencies.js";
export { paymentTermEntity } from "./payment-terms.js";
export { paymentMethodEntity } from "./payment-methods.js";
export { shipmentMethodEntity } from "./shipment-methods.js";
export { unitOfMeasureEntity } from "./units-of-measure.js";
export { itemCategoryEntity } from "./item-categories.js";
export { countryRegionEntity } from "./countries-regions.js";
export { companyInformationEntity } from "./company-information.js";
export { taxGroupEntity } from "./tax-groups.js";
export { contactEntity } from "./contacts.js";
export { bankAccountEntity } from "./bank-accounts.js";
export { agedAccountsReceivableEntity } from "./aged-accounts-receivable.js";
export { agedAccountsPayableEntity } from "./aged-accounts-payable.js";

// Import all for the aggregate array
import { customerEntity } from "./customers.js";
import { vendorEntity } from "./vendors.js";
import { itemEntity } from "./items.js";
import { salesOrderEntity } from "./sales-orders.js";
import { salesOrderLineEntity } from "./sales-order-lines.js";
import { salesInvoiceEntity } from "./sales-invoices.js";
import { salesInvoiceLineEntity } from "./sales-invoice-lines.js";
import { salesQuoteEntity } from "./sales-quotes.js";
import { salesQuoteLineEntity } from "./sales-quote-lines.js";
import { salesCreditMemoEntity } from "./sales-credit-memos.js";
import { salesCreditMemoLineEntity } from "./sales-credit-memo-lines.js";
import { purchaseOrderEntity } from "./purchase-orders.js";
import { purchaseOrderLineEntity } from "./purchase-order-lines.js";
import { purchaseInvoiceEntity } from "./purchase-invoices.js";
import { purchaseInvoiceLineEntity } from "./purchase-invoice-lines.js";
import { generalLedgerEntryEntity } from "./general-ledger-entries.js";
import { journalEntity } from "./journals.js";
import { journalLineEntity } from "./journal-lines.js";
import { accountEntity } from "./accounts.js";
import { dimensionEntity } from "./dimensions.js";
import { dimensionValueEntity } from "./dimension-values.js";
import { employeeEntity } from "./employees.js";
import { currencyEntity } from "./currencies.js";
import { paymentTermEntity } from "./payment-terms.js";
import { paymentMethodEntity } from "./payment-methods.js";
import { shipmentMethodEntity } from "./shipment-methods.js";
import { unitOfMeasureEntity } from "./units-of-measure.js";
import { itemCategoryEntity } from "./item-categories.js";
import { countryRegionEntity } from "./countries-regions.js";
import { companyInformationEntity } from "./company-information.js";
import { taxGroupEntity } from "./tax-groups.js";
import { contactEntity } from "./contacts.js";
import { bankAccountEntity } from "./bank-accounts.js";
import { agedAccountsReceivableEntity } from "./aged-accounts-receivable.js";
import { agedAccountsPayableEntity } from "./aged-accounts-payable.js";

/**
 * Array containing all standard Business Central API v2.0 entity definitions.
 * Use this to register all entities with the EntityRegistry at startup.
 */
export const allStandardEntities: EntityDefinition[] = [
  // Core entities
  customerEntity,
  vendorEntity,
  itemEntity,

  // Sales documents
  salesOrderEntity,
  salesOrderLineEntity,
  salesInvoiceEntity,
  salesInvoiceLineEntity,
  salesQuoteEntity,
  salesQuoteLineEntity,
  salesCreditMemoEntity,
  salesCreditMemoLineEntity,

  // Purchase documents
  purchaseOrderEntity,
  purchaseOrderLineEntity,
  purchaseInvoiceEntity,
  purchaseInvoiceLineEntity,

  // Finance
  generalLedgerEntryEntity,
  journalEntity,
  journalLineEntity,
  accountEntity,
  dimensionEntity,
  dimensionValueEntity,

  // Setup / Reference
  employeeEntity,
  currencyEntity,
  paymentTermEntity,
  paymentMethodEntity,
  shipmentMethodEntity,
  unitOfMeasureEntity,
  itemCategoryEntity,
  countryRegionEntity,
  companyInformationEntity,
  taxGroupEntity,
  contactEntity,
  bankAccountEntity,
  agedAccountsReceivableEntity,
  agedAccountsPayableEntity,
];
