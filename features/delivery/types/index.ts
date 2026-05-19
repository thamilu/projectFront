export type DeliveryStatus = 'ordered' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered';

export interface DeliveryDetails {
  trackingNumber: string;
  carrier: string;
  agentName?: string;
  agentPhone?: string;
  status: DeliveryStatus;
  updatedAt: string;
  timeline: {
    status: DeliveryStatus;
    title: string;
    description: string;
    time?: string;
    isCompleted: boolean;
    isCurrent: boolean;
  }[];
}
