import axios from 'axios';
import { FullDrugInfo, SearchResult } from '../../drug-types';

const SERVER_BASE_PATH = import.meta.env.VITE_SERVER_URL;

export async function searchDrugs(
  query: string,
  limit = 20,
  skip = 0
): Promise<SearchResult> {
  console.log(`Requesting to ${SERVER_BASE_PATH}api/drug/search`);
  const response = await axios.get(`${SERVER_BASE_PATH}api/drug/search`, {
    params: {
      q: query,
      limit,
      skip,
    },
  });
  return response.data;
}

export async function getDrug(drugId: string): Promise<FullDrugInfo> {
  console.log(`Requesting to ${SERVER_BASE_PATH}api/drug/${drugId}`);
  const response = await axios.get(`${SERVER_BASE_PATH}api/drug/${drugId}`);
  return response.data;
}
