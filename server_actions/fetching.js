'use server'


export const fetchCall = async (params, url) => {
  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.XAPIKEYBEDROCKAPI
          },
          body: JSON.stringify(params)
      });


      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      return await response.json();
  } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      throw error;
  }
};