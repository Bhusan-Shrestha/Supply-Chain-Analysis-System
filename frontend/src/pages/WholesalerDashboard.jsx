import MiddleTierDashboard from './MiddleTierDashboard';

export default function WholesalerDashboard() {
  return (
    <MiddleTierDashboard
      role="wholesaler"
      buysFromRole="vendor"
      priceField="vendor_price"
      buyerLabel="Retailer"
    />
  );
}
