import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Company prefix - change this to your company code
const COMPANY_PREFIX = 'MAD';

// Department codes mapping
const DEPT_CODES: Record<string, string> = {
  it: 'IT',
  maintenance: 'MT',
  operation: 'OP',
  admin: 'AD',
  hr: 'HR',
  accounts: 'AC',
  inventory: 'IV',
  purchasing: 'PU',
};

/**
 * Generate asset code in format: MAD + DEPT_CODE + SEQUENTIAL_NUMBER
 * Example: MADIT0012, MADMT0005, MADOP0099
 */
export async function generateAssetCode(department: string): Promise<string> {
  const deptCode = DEPT_CODES[department] || 'XX';
  const prefix = `${COMPANY_PREFIX}${deptCode}`;
  
  try {
    // Query for existing assets with this department to find the highest number
    const assetsRef = collection(db, 'assets');
    const q = query(
      assetsRef,
      where('assetCode', '>=', prefix),
      where('assetCode', '<', prefix + '\uf8ff'),
      orderBy('assetCode', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    let nextNumber = 1;
    
    if (!snapshot.empty) {
      const lastAsset = snapshot.docs[0].data();
      const lastCode = lastAsset.assetCode as string;
      // Extract the number part (last 4 digits)
      const match = lastCode.match(/(\d{4})$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    
    // Format with leading zeros (4 digits)
    const sequentialNumber = nextNumber.toString().padStart(4, '0');
    return `${prefix}${sequentialNumber}`;
  } catch (error) {
    console.error('Error generating asset code:', error);
    // Fallback: generate based on timestamp if query fails
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${timestamp}`;
  }
}

/**
 * Validate asset code format
 */
export function isValidAssetCode(code: string): boolean {
  const pattern = new RegExp(`^${COMPANY_PREFIX}[A-Z]{2}\\d{4}$`);
  return pattern.test(code);
}

/**
 * Parse asset code to extract components
 */
export function parseAssetCode(code: string): { prefix: string; deptCode: string; number: string } | null {
  const match = code.match(new RegExp(`^(${COMPANY_PREFIX})([A-Z]{2})(\\d{4})$`));
  if (match) {
    return {
      prefix: match[1],
      deptCode: match[2],
      number: match[3],
    };
  }
  return null;
}

/**
 * Get department name from department code
 */
export function getDepartmentFromCode(deptCode: string): string {
  const entry = Object.entries(DEPT_CODES).find(([_, code]) => code === deptCode);
  return entry ? entry[0] : 'unknown';
}
