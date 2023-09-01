import React from 'react';
import { BasicDrugInfo, nameProductType } from '../../drug-types';

export interface BasicDrugCardProps {
  drug: BasicDrugInfo;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

function getBadgeByType(type: string) {
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

function getNameByType(type: string) {
  switch (type) {
    case 'MoA':
      return 'Mechanism';
    case 'PE':
      return 'Effect';
    case 'Chemical/Ingredient':
      return 'Chemical';
    case 'EPC':
      return 'Class';
    default:
      return type;
  }
}

export default function BasicDrugCard({ drug, onClick }: BasicDrugCardProps) {
  return (
    <div
      className={`relative card card-compact w-96 shadow-md rounded-md overflow-hidden hover:bg-neutral-focus transition-colors ${
        drug.drugFinished ? 'bg-neutral' : 'bg-base-100 cross-out'
      }`}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 text-xs bg-base-100 text-base-content px-2 py-1 rounded-bl-md">
        {(drug.drugFinished ? '' : 'UNFINISHED • ') +
          nameProductType(drug.productTypeName)}
      </div>
      <div className="card-body !py-5">
        <div className="card-title !mb-0">
          {drug.proprietaryName}
          <span className="opacity-60 overflow-hidden whitespace-nowrap text-ellipsis">
            {drug.proprietaryNameSuffix}
          </span>
        </div>
        <div className="text-lg text-accent">
          {drug.nonProprietaryNames.join(', ')}
        </div>
        <div className="flex flex-col gap-2">
          {drug.pharmClasses
            .sort((a, b) =>
              a.classType === 'EPC' ? -1 : b.classType === 'EPC' ? 1 : 0
            )
            .slice(0, 3)
            .map(pharmClass => (
              <div className="flex gap-2 items-center">
                <div
                  className={`badge ${getBadgeByType(pharmClass.classType)}`}
                >
                  {getNameByType(pharmClass.classType)}
                </div>
                <div>{pharmClass.className}</div>
              </div>
            ))}
        </div>
        {drug.pharmClasses.length > 3 ? (
          <div className="text-xs">and {drug.pharmClasses.length - 3} more</div>
        ) : null}
        <div className="text-sm first-letter:uppercase lowercase">
          {drug.routes.join('/')} {drug.dosageForms.join(', ')}
        </div>
        <div className="text-xs opacity-50 overflow-hidden whitespace-nowrap text-ellipsis">
          {drug.labelerName}
        </div>
      </div>
    </div>
  );
}
