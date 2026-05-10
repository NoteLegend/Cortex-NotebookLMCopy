const BASE_URL = 'https://notebook-llm-theta.vercel.app/Backend';
// const BASE_URL = 'http://127.0.0.1:8000/Backend';

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/uploadDataThroughFile`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  const data = await response.json();
  return data.session_id;
};

export const uploadRawText = async (text: string): Promise<string> => {
  const formData = new FormData();
  formData.append('text_data', text);

  const response = await fetch(`${BASE_URL}/uploadDataThroughRawText`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload text');
  }

  const data = await response.json();
  return data.session_id;
};

export const sendQuery = async (sessionId: string, query: string): Promise<string> => {
  const response = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId, query }),
  });

  if (!response.ok) {
    throw new Error('Failed to send query');
  }

  const data = await response.json();
  return data.response;
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/deleteSessionId?session_id=${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
};
