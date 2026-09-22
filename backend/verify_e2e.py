import urllib.request
import json
from datetime import date, timedelta

base_url = 'http://127.0.0.1:8000'

# 1. Health check
req = urllib.request.urlopen(f'{base_url}/health')
print('1. Health check:', json.loads(req.read().decode()))

# 2. Search Mumbai Central (BCT) -> New Delhi (NDLS)
target_date = (date.today() + timedelta(days=2)).isoformat()
req = urllib.request.urlopen(f'{base_url}/api/v1/trains/search?from=BCT&to=NDLS&journey_date={target_date}')
search_data = json.loads(req.read().decode())
print(f'2. Search BCT -> NDLS found trains: {len(search_data["data"])}')
for t in search_data['data']:
    classes = [c['coach_class'] for c in t['availability']]
    print(f'   - Train {t["train_number"]}: {t["name"]} | Classes: {classes}')

# 3. Fare calculation
req = urllib.request.urlopen(f'{base_url}/api/v1/fares/calculate?train_number=12951&coach_class=3A&passengers_count=2')
fare_data = json.loads(req.read().decode())
print(f'3. Fare calculation (12951 3A for 2 pax): INR {fare_data["data"]["total_fare"]}')

# 4. Login user@railone.demo
login_payload = json.dumps({'email': 'user@railone.demo', 'password': 'User@12345'}).encode('utf-8')
login_req = urllib.request.Request(f'{base_url}/api/v1/auth/login', data=login_payload, headers={'Content-Type': 'application/json'})
login_res = json.loads(urllib.request.urlopen(login_req).read().decode())
token = login_res['data']['access_token']
print(f'4. Login user@railone.demo succeeded. User: {login_res["data"]["user"]["email"]}, Role: {login_res["data"]["user"]["role"]}')

# 5. Create end-to-end booking
first_train = search_data['data'][0]
booking_payload = json.dumps({
    'train_id': first_train['id'],
    'from_station_id': first_train['from_station']['id'],
    'to_station_id': first_train['to_station']['id'],
    'journey_date': target_date,
    'coach_class': '3A',
    'quota': 'GENERAL',
    'payment_method': 'UPI',
    'passengers': [
        {'full_name': 'Aarav Sharma', 'age': 30, 'gender': 'MALE', 'berth_preference': 'LOWER'}
    ]
}).encode('utf-8')
book_req = urllib.request.Request(f'{base_url}/api/v1/bookings', data=booking_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
book_res = json.loads(urllib.request.urlopen(book_req).read().decode())
pnr = book_res['data']['pnr']
print(f'5. Booking created! PNR: {pnr}, Status: {book_res["data"]["status"]}, Total: INR {book_res["data"]["total_amount"]}')

# 6. Check PNR status
pnr_req = urllib.request.urlopen(f'{base_url}/api/v1/pnr/{pnr}')
pnr_res = json.loads(pnr_req.read().decode())
print(f'6. PNR Inquiry booking_status: {pnr_res["data"]["booking_status"]}, Passengers: {len(pnr_res["data"]["passengers"])}')

# 7. Cancel booking
cancel_req = urllib.request.Request(f'{base_url}/api/v1/bookings/{pnr}/cancel', data=b'', headers={'Authorization': f'Bearer {token}'}, method='POST')
cancel_res = json.loads(urllib.request.urlopen(cancel_req).read().decode())
print(f'7. Booking cancelled! Refund status: {cancel_res["data"]["refund_status"]}, Refund amount: INR {cancel_res["data"]["refund_amount"]}, Refund ref: {cancel_res["data"]["refund_ref"]}')

print('\nALL 7 END-TO-END WORKFLOW VERIFICATIONS PASSED!')
