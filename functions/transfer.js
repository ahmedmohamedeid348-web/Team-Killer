import requests
import json

def handler(event, context):
    headers_res = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers_res, 'body': 'OK'}

    try:
        body = json.loads(event.get('body', '{}'))
        phone = body.get('phone', '').strip()
        password = body.get('password', '').strip()

        # 1. تسجيل الدخول بدقة أعلى
        login_url = "https://mobile.vodafone.com.eg/auth/realms/vf-realm/protocol/openid-connect/token"
        login_data = {
            "username": phone, "password": password,
            "grant_type": "password", "client_id": "ana-vodafone-app",
            "client_secret": "95fd95fb-7489-4958-8ae6-d31a525cd20a"
        }
        
        # محاكاة كاملة للهيدرز الخاصة بالتطبيق
        h_login = {
            'User-Agent': 'okhttp/4.12.0',
            'X-App-Version': '15.0.0',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        r_login = requests.post(login_url, data=login_data, headers=h_login, timeout=15)
        
        if r_login.status_code != 200:
            return {'statusCode': 401, 'headers': headers_res, 'body': json.dumps({'message': 'تأكد من الرقم أو الباسورد (أنا فودافون)'})}
        
        token = r_login.json().get("access_token")

        # 2. الترحيل المباشر
        enc_id = "sIsvF1igZR8nXmvj4t8rDDfOihuooqcs1+0yDQaZnj1yf11dtj4VpRlaU1u+jNPTm27iemDObpE4EC4U94bSTZRNDImUKC9bLc2hKW8B/q0Pz67K+aehvOiSt5Lv68QAmGC/laloDUhIIxPokI3KYLMdweAZ63MlveYRqEYXsPdi7tfIXLfieW04uXC7qqLAC3oYiA5Y51BO5qSLNdkJYwIi7w=="
        
        transfer_url = "https://mobile.vodafone.com.eg/services/dxl/pom/productOrder"
        payload = {
            "channel": {"name": "MobileApp"},
            "orderItem": [{
                "action": "add",
                "product": {
                    "encProductId": enc_id, "id": "FLEX5.0_ROLLOVER",
                    "relatedParty": [{"id": phone, "name": "MSISDN", "role": "Subscriber"}]
                }
            }], "@type": "flex"
        }

        h_transfer = {
            'User-Agent': "okhttp/4.11.0",
            'Content-Type': "application/json",
            'Authorization': f"Bearer {token}",
            'msisdn': phone
        }

        r_final = requests.post(transfer_url, json=payload, headers=h_transfer, timeout=15)

        if r_final.status_code in [200, 201, 202]:
            return {'statusCode': 200, 'headers': headers_res, 'body': json.dumps({'message': 'تم الترحيل بنجاح! ✅'})}
        else:
            return {'statusCode': 400, 'headers': headers_res, 'body': json.dumps({'message': 'الحساب غير مؤهل للترحيل (لا توجد فليكسات متبقية)'})}

    except Exception as e:
        return {'statusCode': 500, 'headers': headers_res, 'body': json.dumps({'message': f'خطأ تقني: {str(e)}'})}
