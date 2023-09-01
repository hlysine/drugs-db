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

export function nameProductType(productType: string) {
  if (productType === 'HUMAN OTC DRUG') {
    return 'OTC';
  } else if (productType === 'HUMAN PRESCRIPTION DRUG') {
    return 'PRESCRIPTION';
  } else {
    return productType;
  }
}

export interface FullDrugInfo extends BasicDrugInfo {
  /**
   * Products of the drug
   */
  products: Product[];
}

export interface SearchResult {
  total: number;
  limit: number;
  skip: number;
  items: BasicDrugInfo[];
}
