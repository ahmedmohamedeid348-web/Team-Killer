const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { phone, password } = JSON.parse(event.body);

    // 1. تسجيل الدخول
    const loginData = `username=${phone}&password=${password}&grant_type=password&client_id=ana-vodafone-app&client_secret=95fd95fb-7489-4958-8ae6-d31a525cd20a`;
    
    const loginRes = await axios.post('https://mobile.vodafone.com.eg/auth/realms/vf-realm/protocol/openid-connect/token', loginData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'okhttp/4.12.0' }
    });

    const token = loginRes.data.access_token;

    // 2. الترحيل
    const enc_id = "sIsvF1igZR8nXmvj4t8rDDfOihuooqcs1+0yDQaZnj1yf11dtj4VpRlaU1u+jNPTm27iemDObpE4EC4U94bSTZRNDImUKC9bLc2hKW8B/q0Pz67K+aehvOiSt5Lv68QAmGC/laloDUhIIxPokI3KYLMdweAZ63MlveYRqEYXsPdi7tfIXLfieW04uXC7qqLAC3oYiA5Y51BO5qSLNdkJYwIi7w==";
    
    const payload = {
      channel: { name: "MobileApp" },
      orderItem: [{
        action: "add",
        product: { encProductId: enc_id, id: "FLEX5.0_ROLLOVER", relatedParty: [{ id: phone, name: "MSISDN", role: "Subscriber" }] }
      }],
      "@type": "flex"
    };

    const transferRes = await axios.post('https://mobile.vodafone.com.eg/services/dxl/pom/productOrder', payload, {
      headers: { 'Authorization': `Bearer ${token}`, 'msisdn': phone, 'Content-Type': 'application/json', 'User-Agent': 'okhttp/4.11.0' }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "تم ترحيل الفليكسات بنجاح! ✅" })
    };

  } catch (error) {
    let msg = "بيانات الدخول غلط أو الحساب غير مؤهل";
    if (error.response && error.response.status === 401) msg = "الرقم أو الباسورد غلط ❌";
    
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: msg })
    };
  }
};
