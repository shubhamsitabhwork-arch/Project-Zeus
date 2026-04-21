// This file acts as the "Brain" that reads raw text messages and extracts financial data.
export function parseBankSMS(smsText, vendorMap = {}) {
  const textLower = smsText.toLowerCase();

  // 1. SECURITY BOUNCER: Only process messages belonging to your specific accounts
  const myAccounts = ['xx2007', 'xx4008', 'xx0979', 'xx412', 'xx7412', 'amazon pay balance']; 
  let isMine = false;
  for (let acc of myAccounts) {
    if (textLower.includes(acc)) { isMine = true; break; }
  }
  if (textLower.includes('cred')) isMine = true;
  
  // If it's not your bank message, ignore it entirely
  if (!isMine) return null;

  // 2. EXTRACTION VARIABLES
  let amount = 0; let merchant = "Unknown"; let type = "DEBIT"; let source = "UNKNOWN";

  // Regex to find "Rs X,XXX.XX" or "INR X.XX"
  const amountMatch = smsText.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)/i);
  if (amountMatch) amount = parseFloat(amountMatch[1].replace(/,/g, '')); 

  // Determine if money came IN (Credit) or went OUT (Debit)
  if (textLower.includes('debited') || textLower.includes('spent') || textLower.includes('paid') || textLower.includes('payment of')) type = 'DEBIT';
  else if (textLower.includes('credited') || textLower.includes('added')) type = 'CREDIT';

  // Extract the Merchant name based on different bank SMS formats
  const cardMerchantMatch = smsText.match(/on\s+(.+?)\.\s+Avl Limit/i);
  const upiMerchantMatch = smsText.match(/;\s+(.+?)\s+credited/i);
  const amazonPayBalMatch = smsText.match(/successful at\s+(.+?)\./i);

  if (cardMerchantMatch) merchant = cardMerchantMatch[1].trim();
  else if (upiMerchantMatch) merchant = upiMerchantMatch[1].trim();
  else if (amazonPayBalMatch && textLower.includes('amazon pay balance')) merchant = amazonPayBalMatch[1].trim();

  // 3. SOURCE ROUTER: Tag which wallet the money moved through
  if (textLower.includes('xx2007')) source = "VISA_CREDIT";
  else if (textLower.includes('xx4008') || textLower.includes('amazon pay credit')) source = "AMAZON_CREDIT";
  else if (textLower.includes('xx0979')) source = "DEBIT_CARD";
  else if (textLower.includes('amazon pay balance')) source = "AMAZON_PAY_BALANCE";
  else if (textLower.includes('xx412') || textLower.includes('xx7412') || textLower.includes('upi')) source = "ICICI_ACCOUNT";

  // 4. NEURAL CATEGORY ENGINE: Check local memory first, then fallback to defaults
  let category = "⬜ GENERAL";
  const m = merchant.toLowerCase();

  // Check if you have manually saved this vendor before
  const customCategory = Object.keys(vendorMap).find(key => m.includes(key.toLowerCase()));
  
  if (customCategory) {
      category = vendorMap[customCategory];
  } else {
      // Hardcoded defaults if it's a new vendor
      if (m.includes('swiggy') || m.includes('zomato') || m.includes('mcdonald') || m.includes('blinkit')) category = "🍔 FOOD/GROCERY";
      else if (m.includes('uber') || m.includes('ola') || m.includes('irctc') || m.includes('petrol')) category = "🚗 TRANSIT";
      else if (m.includes('amazon') || m.includes('flipkart') || m.includes('myntra')) category = "🛒 SHOPPING";
      else if (m.includes('netflix') || m.includes('spotify') || m.includes('jio') || m.includes('airtel')) category = "🔁 SUBSCRIPTION";
      else if (m.includes('anjul') || m.includes('shobha') || m.includes('snehil')) category = "👨‍👩‍👦 FAMILY";
  }

  // Combine category and merchant string
  merchant = `${category} | ${merchant}`;

  // Return the structured JSON object
  return { amount, merchant, type, source };
}