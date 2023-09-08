export interface Substance {
  /**
   * Names of the substance
   */
  substanceName: string | undefined;
  /**
   * Amount of the ingredient in each unit of the drug
   */
  activeNumeratorStrength: string;
  /**
   * Unit of the ingredient in each unit of the drug
   */
  activeIngredUnit: string;
}

export interface PharmClass {
  classType: string;
  className: string;
}

export interface DrugPackage {
  /**
   * National drug code of the package
   */
  ndcPackageCode: string;
  /**
   * Package description in a list of strings ordered by hierarchy
   */
  packageDescription: string[];
}

export interface DrugPackageInfo extends DrugPackage {
  productId: string;
  /**
   * National drug code of the product
   */
  productNdc: string;
}

export interface Product {
  /**
   * National drug code of the product, unique to each formulation only
   */
  productNdc: string;
  substances: Substance[];
  packages: DrugPackage[];
  /**
   * Date on which marketing for the drug has started
   */
  startMarketingDate: Date;
  /**
   * Date on which marketing for the drug has ended
   * (if applicable)
   */
  endMarketingDate: Date | undefined;
  /**
   * Marketing category of the drug
   */
  marketingCategoryName: string;
}

export interface BasicDrugInfo {
  drugFinished: boolean;
  /**
   * Code for the drug which is unique to each drug but common across all formulations
   */
  drugId: string;
  /**
   * Broad category of the product.
   * e.g. "HUMAN OTC DRUG" or "HUMAN PRESCRIPTION DRUG"
   */
  productTypeName: string;
  /**
   * Proprietary name of the product
   */
  proprietaryName: string | undefined;
  /**
   * Proprietary name suffix of the product
   */
  proprietaryNameSuffix: string | undefined;
  /**
   * Non-proprietary names of the product
   */
  nonProprietaryNames: string[];
  /**
   * Dosage forms of the product
   */
  dosageForms: string[];
  /**
   * Routes of administration of the product
   */
  routes: string[];
  /**
   * Application number of the drug
   */
  applicationNumber: string | undefined;
  /**
   * Labeler name of the drug
   */
  labelerName: string;
  /**
   * Pharmaceutical classes of the drug
   */
  pharmClasses: PharmClass[];
  /**
   * DEA schedule of the drug
   */
  deaSchedule: string | undefined;
}

export interface FullDrugInfo extends BasicDrugInfo {
  /**
   * Products of the drug
   */
  products: Product[];
}

export function nameMarketingCategory(category: string) {
  switch (category) {
    case 'ANADA':
      return 'Approved Abbreviated Animal Drug';
    case 'ANDA':
      return 'Approved Abbreviated Drug';
    case 'BLA':
      return 'Approved Biologic License';
    case 'BULK INGREDIENT':
      return 'Bulk Ingredient';
    case 'CONDITIONAL NADA':
      return 'Conditional Animal Drug';
    case 'EXPORT ONLY':
      return 'Export Only';
    case 'IND':
      return 'Investigational Drug';
    case 'NADA':
      return 'Approved Animal Drug';
    case 'NDA':
      return 'Approved Drug';
    case 'NDA AUTHORIZED GENERIC':
      return 'Approved Drug (Generic)';
    case 'OTC MONOGRAPH FINAL':
      return 'OTC Drug Monograph (Final)';
    case 'OTC MONOGRAPH NOT FINAL':
      return 'OTC Drug Monograph (Not Final)';
    case 'UNAPPROVED OTHER MARKETING CATEGORY':
      return 'Unapproved Others';
    default:
      return category;
  }
}

export function getBadgeByType(type: string) {
  switch (type) {
    case 'MoA':
      return 'badge-primary';
    case 'PE':
      return 'badge-accent';
    case 'Chemical/Ingredient':
      return 'badge-ghost';
    case 'EPC':
      return 'badge-secondary';
    default:
      return '';
  }
}

export function getNameByType(type: string, long: boolean) {
  switch (type) {
    case 'MoA':
      return long ? 'Mechanism of action' : 'Mechanism';
    case 'PE':
      return long ? 'Physiologic Effect' : 'Effect';
    case 'Chemical/Ingredient':
      return long ? 'Chemical Structure' : 'Chemical';
    case 'EPC':
      return long ? 'Established Class' : 'Class';
    default:
      return type;
  }
}

export function nameProductType(productType: string) {
  if (productType === 'HUMAN OTC DRUG') {
    return 'OTC';
  } else if (productType === 'HUMAN PRESCRIPTION DRUG') {
    return 'PRESCRIPTION';
  } else {
    return productType;
  }
}

export interface SearchResult {
  total: number;
  limit: number;
  skip: number;
  /**
   * Indicates that the quality of the results is bad.
   * Client may provide alternatives.
   */
  badSearch: boolean;
  items: BasicDrugInfo[];
}

export interface WikiResult {
  batchcomplete: string;
  continue: WikiContinue;
  query: WikiQuery;
}

export interface WikiContinue {
  gpsoffset: number;
  continue: string;
}

export interface WikiQuery {
  redirects: WikiRedirect[];
  pages: { [key: string]: WikiPage };
}

export interface WikiPage {
  pageid: number;
  ns: number;
  title: string;
  index: number;
  extract: string;
}

export interface WikiRedirect {
  index: number;
  from: string;
  to: string;
  tofragment?: string;
}
