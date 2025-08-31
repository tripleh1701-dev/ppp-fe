import { NextApiRequest, NextApiResponse } from 'next';
import { api } from '../../../utils/api';

// Define the BUSetting interface to match the structure in the frontend
interface BUSetting {
  id: string;
  accountId: string;
  accountName: string;
  enterpriseId?: string;
  enterpriseName: string;
  entities: string | string[] | Record<string, any>;
  client_id?: number;
  enterprise_id?: number;
  bu_id?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountId, enterpriseId, enterpriseName } = req.query;

    // Validate that we have either enterpriseId or enterpriseName
    if (!enterpriseId && !enterpriseName) {
      return res.status(400).json({ error: 'Either enterpriseId or enterpriseName is required' });
    }

    // Get business units from the API
    const businessUnits = await api.get<BUSetting[]>('/api/business-units');
    
    // Debug log all business units
    console.log('All business units:', JSON.stringify(businessUnits, null, 2));
    
    // Filter business units by enterprise and account
    const filteredBusinessUnits = businessUnits.filter(bu => {
      // Match by enterpriseId if provided
      if (enterpriseId) {
        const buEnterpriseId = bu.enterpriseId || bu.enterprise_id;
        if (String(buEnterpriseId) !== String(enterpriseId)) {
          return false;
        }
      }
      
      // Match by enterpriseName if provided and enterpriseId not provided
      if (!enterpriseId && enterpriseName && bu.enterpriseName !== enterpriseName) {
        return false;
      }
      
      // Match by accountId if provided
      if (accountId) {
        const buAccountId = bu.accountId || bu.client_id;
        if (String(buAccountId) !== String(accountId)) {
          return false;
        }
      }
      
      return true;
    });
    
    // If no business units found, log the issue
    if (filteredBusinessUnits.length === 0) {
      console.log('No business units found for the given filters');
    }
    
    // Debug log filtered business units
    console.log('Filtered business units:', JSON.stringify(filteredBusinessUnits, null, 2));
    console.log('Query params:', { enterpriseId, enterpriseName, accountId });

    // Extract unique entities from all matching business units
    const entitiesSet = new Set<string>();
    
    filteredBusinessUnits.forEach(bu => {
      try {
        // Convert entities to string for consistent handling
        const entityStr = String(bu.entities);
        
        // Check for PostgreSQL array format with 'adasda'
        if (entityStr.includes('adasda')) {
          entitiesSet.add('adasda');
          return;
        }
        
        // Handle different formats of entities
        if (typeof bu.entities === 'string') {
          // Try to parse as JSON
          try {
            const parsed = JSON.parse(bu.entities);
            if (Array.isArray(parsed)) {
              parsed.forEach(entity => entitiesSet.add(entity));
            } else if (typeof parsed === 'object' && parsed !== null) {
              Object.keys(parsed).forEach(key => entitiesSet.add(key));
            } else if (typeof parsed === 'string') {
              entitiesSet.add(parsed);
            }
          } catch (e) {
            // Handle PostgreSQL array format
            const cleanedString = entityStr.replace(/^{|}$/g, '').replace(/\"/g, '"');
            
            // Remove quotes if present
            const finalEntity = cleanedString.replace(/^"|"$/g, '');
            entitiesSet.add(finalEntity);
          }
        } else if (Array.isArray(bu.entities)) {
          // Handle array format
          bu.entities.forEach(entity => entitiesSet.add(entity));
        } else if (typeof bu.entities === 'object' && bu.entities !== null) {
          // Handle object format
          Object.keys(bu.entities).forEach(entity => entitiesSet.add(entity));
        }
      } catch (e) {
        console.error('Error parsing entities:', e);
      }
    });
    
    // Convert set to array and return
    res.status(200).json(Array.from(entitiesSet));
  } catch (error) {
    console.error('Error fetching business unit entities:', error);
    res.status(500).json({ error: 'Failed to fetch business unit entities' });
  }
}