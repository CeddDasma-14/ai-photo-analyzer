import axios from 'axios';

/**
 * Sends a photo to the backend for analysis.
 * @param {File} file
 * @returns {{ category: string, confidence: number, result: object }}
 */
export async function analyzePhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  try {
    const response = await axios.post('/api/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000 // 30s timeout
    });
    return response.data;
  } catch (err) {
    // Normalize error messages for the UI
    if (err.code === 'ECONNABORTED') {
      throw new Error('Request timed out. The AI is taking too long — please try again.');
    }
    if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    }
    if (!err.response) {
      throw new Error('Cannot reach the server. Make sure the backend is running.');
    }
    throw new Error('Something went wrong. Please try again.');
  }
}
