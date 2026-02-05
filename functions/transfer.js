const axios = require('axios');

exports.handler = async (event, context) => {
    const headers_res = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: headers_res, body: '' };

    try {
        const { phone, password } = JSON.parse(event.body);

        // 1. تسجيل الدخول بالرؤوس الدقيقة اللي بعتها
        const loginData = `username=${phone}&password=${password}&grant_type=password&client_id=ana-vodafone-app&client_secret=95fd95fb-7489-4958-8ae6-d31a525cd20a`;
        
        const loginRes = await axios.post('https://mobile.vodafone.com.eg/auth/realms/vf-realm/protocol/openid-connect/token', loginData, {
            headers: {
                'User-Agent': "okhttp/4.12.0",
                'Accept-Language': "ar",
                'Content-Type': "application/x-www-form-urlencoded",
                'clientId': "AnaVodafoneAndroid",
                'x-agent-device': "OPPO CPH2603",
                'device-id': "7c9a4c9619e17143"
            }
        });

        const token = loginRes.data.access_token;

        // 2. ترحيل الفليكسات بالـ encProductId الجديد
        const payload = {
            "channel": { "name": "MobileApp" },
            "orderItem": [{
                "action": "add",
                "product": {
                    "encProductId": "IFdE5O5b7ULUOgxwICC+2jMBdJOIL4XY8IYpGNSjXm+4gahXzQh+phpifc72Zke1DtZyRzGG6xR1WSPdVioaU9bG4RCpDaLpkdHcoxYMOe2jWUzeAjtsO57d/IDvcZ/mo8Z4q59D3eGam0Wu51B5xyfMDP1QCyqdrLMi2vUR30CVdrKzrIsISoHqqwTUgokCF9axQzcTtJpT4aUCmdnziMXvpw==",
                    "id": "FLEX5.0_ROLLOVER",
                    "relatedParty": [{ "id": phone, "name": "MSISDN", "role": "Subscriber" }]
                }
            }],
            "@type": "Flex"
        };

        const transferRes = await axios.post('https://mobile.vodafone.com.eg/services/dxl/pom/productOrder', payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'msisdn': phone,
                'User-Agent': "okhttp/4.12.0",
                'Content-Type': "application/json; charset=UTF-8",
                'Accept-Language': "ar",
                'clientId': "AnaVodafoneAndroid",
                'device-id': "7c9a4c9619e17143",
                'api-host': "ProductOrderingManagement"
            }
        });

        return {
            statusCode: 200,
            headers: headers_res,
            body: JSON.stringify({ message: "✅ تم ترحيل الفليكسات بنجاح!" })
        };

    } catch (error) {
        let errorMsg = "حدث خطأ في البيانات أو الحساب غير مؤهل";
        if (error.response && error.response.data) {
            errorMsg = error.response.data.message || error.response.data.error_description || errorMsg;
        }
        return {
            statusCode: 400,
            headers: headers_res,
            body: JSON.stringify({ message: `❌ ${errorMsg}` })
        };
    }
};
