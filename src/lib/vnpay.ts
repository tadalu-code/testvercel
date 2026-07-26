import crypto from 'crypto';

export function sortObject(obj: any) {
  const sorted: any = {};
  const str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

export function formatVnpDate(date: Date) {
  const pad = (n: number) => (n < 10 ? '0' + n : n.toString());
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}${month}${day}${hour}${minute}${second}`;
}

export function generateVNPayUrl(ipAddr: string, amount: number, orderInfo: string, orderId: string) {
  const tmnCode = process.env.VNP_TMNCODE || 'DUMMY_TMNCODE';
  const secretKey = process.env.VNP_HASHSECRET || 'DUMMY_SECRET';
  const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/vnpay-return`;

  const date = new Date();
  const createDate = formatVnpDate(date);
  
  // Expire after 15 mins
  date.setMinutes(date.getMinutes() + 15);
  const expireDate = formatVnpDate(date);

  let vnp_Params: any = {
    'vnp_Version': '2.1.0',
    'vnp_Command': 'pay',
    'vnp_TmnCode': tmnCode,
    'vnp_Locale': 'vn',
    'vnp_CurrCode': 'VND',
    'vnp_TxnRef': orderId,
    'vnp_OrderInfo': orderInfo,
    'vnp_OrderType': 'other',
    'vnp_Amount': Math.round(amount * 100), // VNPay expects integer amount * 100
    'vnp_ReturnUrl': returnUrl,
    'vnp_IpAddr': ipAddr,
    'vnp_CreateDate': createDate,
    'vnp_ExpireDate': expireDate
  };

  vnp_Params = sortObject(vnp_Params);
  
  // Create signData without double encoding (URLSearchParams would double encode)
  const signData = Object.entries(vnp_Params)
    .map(([key, val]) => `${key}=${val}`)
    .join("&");
    
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
  
  return `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
}

export function verifyVNPayIPN(searchParams: URLSearchParams) {
  const secretKey = process.env.VNP_HASHSECRET || 'DUMMY_SECRET';
  let vnp_Params: any = {};
  
  searchParams.forEach((value, key) => {
    vnp_Params[key] = value;
  });

  const secureHash = vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  
  // Create signData without double encoding
  const signData = Object.entries(vnp_Params)
    .map(([key, val]) => `${key}=${val}`)
    .join("&");
    
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");     

  return {
    isValid: secureHash === signed,
    orderId: vnp_Params['vnp_TxnRef'],
    responseCode: vnp_Params['vnp_ResponseCode'],
    amount: parseInt(vnp_Params['vnp_Amount']) / 100
  };
}
