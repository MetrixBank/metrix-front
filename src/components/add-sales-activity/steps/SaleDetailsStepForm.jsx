import React from 'react';
import { SaleDetailsFormFields } from '../SaleDetailsFormFields';

const SaleDetailsStepForm = ({ products }) => {
  return (
    <div className="space-y-4">
      <SaleDetailsFormFields products={products} />
    </div>
  );
};

export default SaleDetailsStepForm;