import MiddleTierDashboard from './MiddleTierDashboard';

export default function RetailerDashboard() {
  return (
    <MiddleTierDashboard
      role="retailer"
      buysFromRole="wholesaler"
      priceField="wholesale_price"
      buyerLabel="Consumer"
    />
  );
}
