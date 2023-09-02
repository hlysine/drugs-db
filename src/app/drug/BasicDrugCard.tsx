import React from 'react';
import {
  BasicDrugInfo,
  getBadgeByType,
  getNameByType,
  nameProductType,
} from '../../drug-types';

export interface BasicDrugCardProps {
  drug: BasicDrugInfo;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export default function BasicDrugCard({ drug, onClick }: BasicDrugCardProps) {
  return (
    <div
      className={`relative card card-compact w-96 max-w-full shadow-md rounded-md overflow-hidden hover:bg-neutral-focus transition-colors ${
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
              <div
                className="flex gap-2 items-center"
                key={pharmClass.className + pharmClass.classType}
              >
                <div
                  className={`badge ${getBadgeByType(pharmClass.classType)}`}
                >
                  {getNameByType(pharmClass.classType, false)}
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
