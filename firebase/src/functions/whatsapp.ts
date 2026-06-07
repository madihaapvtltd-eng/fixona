import axios from 'axios';

const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';
const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;

interface WhatsAppPayload {
  phoneNumber: string;
  message: string;
  templateName?: string;
}

export async function isWhatsAppConfigured(): Promise<boolean> {
  return !!WHATSAPP_API_KEY && !!WHATSAPP_PHONE_ID && WHATSAPP_API_KEY !== 'mock';
}

export async function sendWhatsAppMessage(payload: WhatsAppPayload): Promise<void> {
  const { phoneNumber, message } = payload;
  
  // Check if WhatsApp is configured
  if (!await isWhatsAppConfigured()) {
    throw new Error('WhatsApp API not configured');
  }
  
  // Format phone number (remove + and spaces)
  const formattedPhone = phoneNumber.replace(/[+\s]/g, '');
  
  try {
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data.error) {
      throw new Error(response.data.error.message);
    }
    
    console.log('WhatsApp message sent:', response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('WhatsApp API error:', error.response?.data || error.message);
      throw new Error(`WhatsApp API error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

export async function sendWhatsAppTemplate(
  phoneNumber: string,
  templateName: string,
  languageCode: string = 'en',
  parameters?: Record<string, string>
): Promise<void> {
  if (!await isWhatsAppConfigured()) {
    throw new Error('WhatsApp API not configured');
  }
  
  const formattedPhone = phoneNumber.replace(/[+\s]/g, '');
  
  const templatePayload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
    },
  };
  
  if (parameters) {
    templatePayload.template.components = [{
      type: 'body',
      parameters: Object.entries(parameters).map(([_, value]) => ({
        type: 'text',
        text: value,
      })),
    }];
  }
  
  try {
    const response = await axios.post(WHATSAPP_API_URL, templatePayload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.data.error) {
      throw new Error(response.data.error.message);
    }
    
    console.log('WhatsApp template sent:', response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('WhatsApp template error:', error.response?.data || error.message);
      throw new Error(`WhatsApp API error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}
