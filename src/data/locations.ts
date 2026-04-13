import type { Location } from '@/src/types/models';
import { departmentById } from './assetContext';

export const locations: Location[] = [
  {
    id: 'loc-central-entrance',
    name: 'Main Entry & Retail',
    department_id: 'dept-visitor-services',
    department_name: departmentById['dept-visitor-services'].name,
    precinct: 'Central Precinct',
    zone: 'Main Entry & Retail',
  },
  {
    id: 'loc-lorikeet-aviary',
    name: 'Lorikeet Aviary',
    department_id: 'dept-animal-care',
    department_name: departmentById['dept-animal-care'].name,
    precinct: 'Central Precinct',
    zone: 'Lorikeet Aviary',
  },
  {
    id: 'loc-koala-habitat',
    name: 'Koala Habitat',
    department_id: 'dept-animal-care',
    department_name: departmentById['dept-animal-care'].name,
    precinct: 'Northern Walk',
    zone: 'Koala Habitat',
  },
  {
    id: 'loc-reptile-house',
    name: 'Reptile House',
    department_id: 'dept-animal-care',
    department_name: departmentById['dept-animal-care'].name,
    precinct: 'Northern Walk',
    zone: 'Reptile House',
  },
  {
    id: 'loc-minirail',
    name: 'Mini-Rail Stations',
    department_id: 'dept-visitor-services',
    department_name: departmentById['dept-visitor-services'].name,
    precinct: 'Transit Loop',
    zone: 'Mini-Rail Stations',
  },
  {
    id: 'loc-vet-clinic',
    name: 'Veterinary Clinic',
    department_id: 'dept-animal-care',
    department_name: departmentById['dept-animal-care'].name,
    precinct: 'Operations',
    zone: 'Veterinary Clinic',
  },
  {
    id: 'loc-quarantine',
    name: 'Quarantine & Holding',
    department_id: 'dept-animal-care',
    department_name: departmentById['dept-animal-care'].name,
    precinct: 'Operations',
    zone: 'Quarantine & Holding',
  },
  {
    id: 'loc-wetlands',
    name: 'Wetlands Boardwalk',
    department_id: 'dept-facilities',
    department_name: departmentById['dept-facilities'].name,
    precinct: 'Southern Walk',
    zone: 'Wetlands Boardwalk',
  },
  {
    id: 'loc-bird-show',
    name: 'Wild Skies Amphitheatre',
    department_id: 'dept-visitor-services',
    department_name: departmentById['dept-visitor-services'].name,
    precinct: 'Southern Walk',
    zone: 'Wild Skies Amphitheatre',
  },
];

export const locationById = Object.fromEntries(locations.map((l) => [l.id, l])) as Record<
  string,
  Location
>;

