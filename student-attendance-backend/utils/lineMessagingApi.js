// utils/lineMessagingApi.js
const axios = require('axios');

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const sendLineMessage = async (userId, messageText) => {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('LINE_CHANNEL_ACCESS_TOKEN is not set. Skipping LINE Messaging API notification.');
    return;
  }

  try {
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages: [
          {
            type: 'text',
            text: messageText
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    console.log('LINE Message API Push notification sent successfully!', response.data);
  } catch (error) {
    console.error('Failed to send LINE Message API Push notification:', error.response ? error.response.data : error.message);
    throw new Error('Failed to send LINE Message API Push notification');
  }
};

const broadcastLineMessage = async (messageText) => {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('LINE_CHANNEL_ACCESS_TOKEN is not set. Skipping LINE Messaging API broadcast.');
    return;
  }

  try {
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/broadcast',
      {
        messages: [
          {
            type: 'text',
            text: messageText
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    console.log('LINE Message API Broadcast sent successfully!', response.data);
  } catch (error) {
    console.error('Failed to send LINE Message API Broadcast:', error.response ? error.response.data : error.message);
    throw new Error('Failed to send LINE Message API Broadcast');
  }
};

module.exports = { sendLineMessage, broadcastLineMessage };