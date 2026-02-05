import json
import requests

def handler(event, context):
    # هيدرز الأمان عشان الموقع يرضى يستلم البيانات
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': 'OK'}

    try:
        body = json.loads(event.get('body', '{}'))
        phone = body.get('phone', '').strip()
        password = body.get('password', '').strip()

        if not phone or not password:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'message': 'برجاء إدخال البيانات'})}

        # تسجيل الدخول
        login_url = "https://mobile.vodafone.com.eg/auth/realms/vf-realm/protocol/openid-connect/token"
        login_data = {
            "username": phone, "password": password,
            "grant_type": "password", "client_id": "ana-vodafone-app",
            "client_secret": "95fd95fb-7489-4958-8ae6-d31a525cd20a"
        }
        
        r = requests.post(login_url, data=login_data, headers={'User-Agent': 'okhttp/4.12.0'}, timeout=10)
        
        if r.status_code != 200:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'message': 'بيانات الدخول غلط'})}
        
        token = r.json().get("access_token")

        # هنا كود الترحيل (استخدمنا enc_id ثابت لضمان السرعة)
        enc_id = "sIsvF1igZR8nXmvj4t8rDDfOihuooqcs1+0yDQaZnj1yf11dtj4VpRlaU1u+jNPTm27iemDObpE4EC4U94bSTZRNDImUKC9bLc2hKW8B/q0Pz67K+aehvOiSt5Lv68QAmGC/laloDUhIIxPokI3KYLMdweAZ63MlveYRqEYXsPdi7tfIXLfieW04uXC7qqLAC3oYiA5Y51BO5qSLNdkJYwIi7w=="
        
        transfer_url = "https://mobile.vodafone.com.eg/services/dxl/pom/productOrder"
        payload = {
            "channel": {"name": "MobileApp"},
            "orderItem": [{
                "action": "add",
                "product": {
                    "encProductId": enc_id,
                    "id": "FLEX5.0_ROLLOVER",
                    "relatedParty": [{"id": phone, "name": "MSISDN", "role": "Subscriber"}]
                }
            }],
            "@type": "flex"
        }
        
        res = requests.post(transfer_url, json=payload, headers={
            'Authorization': f"Bearer {token}",
            'msisdn': phone,
            'Content-Type': "application/json"
        }, timeout=10)

        if res.status_code in [200, 201, 202]:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'تم ترحيل الفليكسات بنجاح! ✅'})}
        else:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'message': 'الحساب غير مؤهل حالياً'})}

    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'message': f'خطأ بالسيرفر: {str(e)}'})}
