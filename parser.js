/**
 * PROJECT ZEUS PARSER v14.0
 * This is the "Translator." It takes messy bank texts and turns them into clean data.
 */
export function parseBankSMS(smsText, vendorMap = {}) {
  const textLower = smsText.toLowerCase();

  // 1. FILTER: Is this my bank? 
  // We check for your specific account endings to ignore junk SMS.
  const myAccounts = ['xx2007', 'xx4008', 'xx0979', 'xx412', 'xx7412', 'amazon pay balance']; 
  let isMine = false;
  for (let acc of myAccounts) { if (textLower.includes(acc)) { isMine = true; break; } }
  if (textLower.includes('cred')) isMine = true;
  if (!isMine) return null;

  // 2. EXTRACTION: Find the money
  let amount = 0; let merchant = "Unknown"; let type = "DEBIT"; let source = "UNKNOWN";

  // This regex finds the numbers following "Rs" or "INR"
  const amountMatch = smsText.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)/i);
  if (amountMatch) amount = parseFloat(amountMatch[1].replace(/,/g, '')); 

  // Determine if money is leaving (DEBIT) or entering (CREDIT)
  if (textLower.includes('debited') || textLower.includes('spent') || textLower.includes('paid') || textLower.includes('payment of')) type = 'DEBIT';
  else if (textLower.includes('credited') || textLower.includes('added')) type = 'CREDIT';

  // Extract the Merchant (Where did the money go?)
  const cardMatch = smsText.match(/on\s+(.+?)\.\s+Avl Limit/i);
  const upiMatch = smsText.match(/;\s+(.+?)\s+credited/i);
  const apayMatch = smsText.match(/successful at\s+(.+?)\./i); // Specific for your Amazon Pay request

  if (cardMatch) merchant = cardMatch[1].trim();
  else if (upiMatch) merchant = upiMatch[1].trim();
  else if (apayMatch && textLower.includes('amazon pay balance')) merchant = apayMatch[1].trim();

  // 3. ROUTING: Which wallet was used?
  if (textLower.includes('xx2007')) source = "VISA_CREDIT";
  else if (textLower.includes('xx4008')) source = "AMAZON_CREDIT";
  else if (textLower.includes('xx0979')) source = "DEBIT_CARD";
  else if (textLower.includes('amazon pay balance')) source = "AMAZON_PAY_BALANCE";
  else if (textLower.includes('xx412') || textLower.includes('xx7412')) source = "ICICI_ACCOUNT";

  // 4. NEURAL MAPPING: Check "Entity Memory"
  // If you saved "Zomato" as "🍔 Food" in the past, it will remember it here.
  let category = "⬜ GENERAL";
  const m = merchant.toLowerCase();
  const savedCategory = Object.keys(vendorMap).find(key => m.includes(key.toLowerCase()));
  if (savedCategory) category = vendorMap[savedCategory];

  merchant = `${category} | ${merchant}`;
  return { amount, merchant, type, source };
}