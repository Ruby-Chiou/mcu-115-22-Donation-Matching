export interface VolunteerDemand {
  id: number;
  title: string;
  serviceItems: string[];
  organization: string;
  required: number;
  registered: number;
  location: string;
  address: string;
  date: string;
  serviceTime: string;
  description: string;
  requirements: string[];
  contactPerson: string;
  phone: string;
  contactAddress: string;
}
