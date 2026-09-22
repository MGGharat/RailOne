# RailOne Demo Seed Data Definition
from datetime import datetime, date, timedelta
from app.core.security import get_password_hash

DEMO_STATIONS = [
    # Western & Central Hubs
    {"code": "CSMT", "name": "Chhatrapati Shivaji Maharaj Terminus", "city": "Mumbai", "state": "Maharashtra", "zone": "CR"},
    {"code": "BCT", "name": "Mumbai Central", "city": "Mumbai", "state": "Maharashtra", "zone": "WR"},
    {"code": "BDTS", "name": "Bandra Terminus", "city": "Mumbai", "state": "Maharashtra", "zone": "WR"},
    {"code": "TNA", "name": "Thane", "city": "Thane", "state": "Maharashtra", "zone": "CR"},
    {"code": "PNVL", "name": "Panvel Junction", "city": "Panvel", "state": "Maharashtra", "zone": "CR"},
    {"code": "NK", "name": "Nashik Road", "city": "Nashik", "state": "Maharashtra", "zone": "CR"},
    {"code": "MAO", "name": "Madgaon Junction", "city": "Goa", "state": "Goa", "zone": "KR"},
    {"code": "PUNE", "name": "Pune Junction", "city": "Pune", "state": "Maharashtra", "zone": "CR"},
    {"code": "LNL", "name": "Lonavala", "city": "Lonavala", "state": "Maharashtra", "zone": "CR"},
    {"code": "SUR", "name": "Solapur", "city": "Solapur", "state": "Maharashtra", "zone": "CR"},
    {"code": "NGP", "name": "Nagpur Junction", "city": "Nagpur", "state": "Maharashtra", "zone": "CR"},
    {"code": "BSL", "name": "Bhusaval Junction", "city": "Bhusawal", "state": "Maharashtra", "zone": "CR"},
    
    # Northern Hubs
    {"code": "NDLS", "name": "New Delhi", "city": "Delhi", "state": "Delhi", "zone": "NR"},
    {"code": "DLI", "name": "Old Delhi Junction", "city": "Delhi", "state": "Delhi", "zone": "NR"},
    {"code": "NZM", "name": "Hazrat Nizamuddin", "city": "Delhi", "state": "Delhi", "zone": "NR"},
    {"code": "ANVT", "name": "Anand Vihar Terminal", "city": "Delhi", "state": "Delhi", "zone": "NR"},
    {"code": "AGC", "name": "Agra Cantt", "city": "Agra", "state": "Uttar Pradesh", "zone": "NCR"},
    {"code": "GWL", "name": "Gwalior Junction", "city": "Gwalior", "state": "Madhya Pradesh", "zone": "NCR"},
    {"code": "VGLJ", "name": "Virangana Lakshmibai Jhansi", "city": "Jhansi", "state": "Uttar Pradesh", "zone": "NCR"},
    {"code": "BPL", "name": "Bhopal Junction", "city": "Bhopal", "state": "Madhya Pradesh", "zone": "WCR"},
    
    # Gujarat & Rajasthan Hubs
    {"code": "ADI", "name": "Ahmedabad Junction", "city": "Ahmedabad", "state": "Gujarat", "zone": "WR"},
    {"code": "BRC", "name": "Vadodara Junction", "city": "Vadodara", "state": "Gujarat", "zone": "WR"},
    {"code": "ST", "name": "Surat", "city": "Surat", "state": "Gujarat", "zone": "WR"},
    {"code": "RTM", "name": "Ratlam Junction", "city": "Ratlam", "state": "Madhya Pradesh", "zone": "WR"},
    {"code": "KOTA", "name": "Kota Junction", "city": "Kota", "state": "Rajasthan", "zone": "WCR"},
    {"code": "JP", "name": "Jaipur Junction", "city": "Jaipur", "state": "Rajasthan", "zone": "NWR"},
    {"code": "AII", "name": "Ajmer Junction", "city": "Ajmer", "state": "Rajasthan", "zone": "NWR"},
    {"code": "JU", "name": "Jodhpur Junction", "city": "Jodhpur", "state": "Rajasthan", "zone": "NWR"},
    {"code": "BKN", "name": "Bikaner Junction", "city": "Bikaner", "state": "Rajasthan", "zone": "NWR"},

    # UP & Bihar Hubs
    {"code": "LKO", "name": "Lucknow Charbagh", "city": "Lucknow", "state": "Uttar Pradesh", "zone": "NR"},
    {"code": "CNB", "name": "Kanpur Central", "city": "Kanpur", "state": "Uttar Pradesh", "zone": "NCR"},
    {"code": "PRYJ", "name": "Prayagraj Junction", "city": "Prayagraj", "state": "Uttar Pradesh", "zone": "NCR"},
    {"code": "BSB", "name": "Varanasi Junction", "city": "Varanasi", "state": "Uttar Pradesh", "zone": "NR"},
    {"code": "GKP", "name": "Gorakhpur Junction", "city": "Gorakhpur", "state": "Uttar Pradesh", "zone": "NER"},
    {"code": "PNBE", "name": "Patna Junction", "city": "Patna", "state": "Bihar", "zone": "ECR"},
    {"code": "GAYA", "name": "Gaya Junction", "city": "Gaya", "state": "Bihar", "zone": "ECR"},

    # Eastern Hubs
    {"code": "HWH", "name": "Howrah Junction", "city": "Kolkata", "state": "West Bengal", "zone": "ER"},
    {"code": "SDAH", "name": "Sealdah", "city": "Kolkata", "state": "West Bengal", "zone": "ER"},
    {"code": "KOAA", "name": "Kolkata Terminal", "city": "Kolkata", "state": "West Bengal", "zone": "ER"},
    {"code": "ASN", "name": "Asansol Junction", "city": "Asansol", "state": "West Bengal", "zone": "ER"},
    {"code": "BBS", "name": "Bhubaneswar", "city": "Bhubaneswar", "state": "Odisha", "zone": "ECoR"},
    {"code": "PURI", "name": "Puri", "city": "Puri", "state": "Odisha", "zone": "ECoR"},
    {"code": "R", "name": "Raipur Junction", "city": "Raipur", "state": "Chhattisgarh", "zone": "SECR"},
    {"code": "GHY", "name": "Guwahati", "city": "Guwahati", "state": "Assam", "zone": "NFR"},

    # Southern Hubs
    {"code": "MAS", "name": "Chennai Central", "city": "Chennai", "state": "Tamil Nadu", "zone": "SR"},
    {"code": "MS", "name": "Chennai Egmore", "city": "Chennai", "state": "Tamil Nadu", "zone": "SR"},
    {"code": "SBC", "name": "KSR Bengaluru", "city": "Bengaluru", "state": "Karnataka", "zone": "SWR"},
    {"code": "YPR", "name": "Yesvantpur Junction", "city": "Bengaluru", "state": "Karnataka", "zone": "SWR"},
    {"code": "CBE", "name": "Coimbatore Junction", "city": "Coimbatore", "state": "Tamil Nadu", "zone": "SR"},
    {"code": "MDU", "name": "Madurai Junction", "city": "Madurai", "state": "Tamil Nadu", "zone": "SR"},
    {"code": "TVC", "name": "Thiruvananthapuram Central", "city": "Thiruvananthapuram", "state": "Kerala", "zone": "SR"},
    {"code": "ERS", "name": "Ernakulam Junction", "city": "Kochi", "state": "Kerala", "zone": "SR"},

    # South Central & Northern Frontiers
    {"code": "HYB", "name": "Hyderabad Deccan", "city": "Hyderabad", "state": "Telangana", "zone": "SCR"},
    {"code": "SC", "name": "Secunderabad Junction", "city": "Secunderabad", "state": "Telangana", "zone": "SCR"},
    {"code": "BZA", "name": "Vijayawada Junction", "city": "Vijayawada", "state": "Andhra Pradesh", "zone": "SCR"},
    {"code": "VSKP", "name": "Visakhapatnam Junction", "city": "Visakhapatnam", "state": "Andhra Pradesh", "zone": "ECoR"},
    {"code": "TPTY", "name": "Tirupati Main", "city": "Tirupati", "state": "Andhra Pradesh", "zone": "SCR"},
    {"code": "CDG", "name": "Chandigarh Junction", "city": "Chandigarh", "state": "Chandigarh", "zone": "NR"},
    {"code": "JAT", "name": "Jammu Tawi", "city": "Jammu", "state": "Jammu & Kashmir", "zone": "NR"}
]

DEMO_USERS = [
    {
        "email": "user@railone.demo",
        "password": "User@12345",
        "full_name": "Aarav Sharma",
        "mobile": "9876543210",
        "role": "USER",
        "gender": "MALE",
        "dob": "1994-08-15",
        "address": "402, Green Meadows, Andheri West, Mumbai, MH"
    },
    {
        "email": "admin@railone.demo",
        "password": "Admin@12345",
        "full_name": "System Administrator",
        "mobile": "9999900001",
        "role": "ADMIN",
        "gender": "OTHER",
        "dob": "1988-01-01",
        "address": "RailOne Operations HQ, Rail Bhawan, New Delhi"
    },
    {
        "email": "priya.patel@railone.demo",
        "password": "User@12345",
        "full_name": "Priya Patel",
        "mobile": "9876543211",
        "role": "USER",
        "gender": "FEMALE",
        "dob": "1996-03-22",
        "address": "Navrangpura, Ahmedabad, Gujarat"
    },
    {
        "email": "rahul.verma@railone.demo",
        "password": "User@12345",
        "full_name": "Rahul Verma",
        "mobile": "9876543212",
        "role": "USER",
        "gender": "MALE",
        "dob": "1991-11-10",
        "address": "Indira Nagar, Bengaluru, Karnataka"
    },
    {
        "email": "ananya.sen@railone.demo",
        "password": "User@12345",
        "full_name": "Ananya Sen",
        "mobile": "9876543213",
        "role": "USER",
        "gender": "FEMALE",
        "dob": "1998-05-19",
        "address": "Salt Lake Sector V, Kolkata, WB"
    },
    {
        "email": "vikram.singh@railone.demo",
        "password": "User@12345",
        "full_name": "Vikram Singh",
        "mobile": "9876543214",
        "role": "USER",
        "gender": "MALE",
        "dob": "1985-09-04",
        "address": "C-Scheme, Jaipur, Rajasthan"
    },
    {
        "email": "kavita.reddy@railone.demo",
        "password": "User@12345",
        "full_name": "Kavita Reddy",
        "mobile": "9876543215",
        "role": "USER",
        "gender": "FEMALE",
        "dob": "1992-07-30",
        "address": "Banjara Hills, Hyderabad, Telangana"
    },
    {
        "email": "siddharth.nair@railone.demo",
        "password": "User@12345",
        "full_name": "Siddharth Nair",
        "mobile": "9876543216",
        "role": "USER",
        "gender": "MALE",
        "dob": "1990-12-05",
        "address": "Palarivattom, Kochi, Kerala"
    },
    {
        "email": "meera.iyer@railone.demo",
        "password": "User@12345",
        "full_name": "Meera Iyer",
        "mobile": "9876543217",
        "role": "USER",
        "gender": "FEMALE",
        "dob": "1995-02-14",
        "address": "Mylapore, Chennai, Tamil Nadu"
    },
    {
        "email": "deepak.gupta@railone.demo",
        "password": "User@12345",
        "full_name": "Deepak Gupta",
        "mobile": "9876543218",
        "role": "USER",
        "gender": "MALE",
        "dob": "1987-04-18",
        "address": "Gomti Nagar, Lucknow, UP"
    }
]

DEMO_PASSENGER_PROFILES = [
    {"full_name": "Aarav Sharma", "age": 31, "gender": "MALE", "berth_preference": "LOWER", "nationality": "INDIAN", "id_type": "AADHAAR", "id_number_masked": "XXXX-XXXX-7182"},
    {"full_name": "Sunita Sharma", "age": 29, "gender": "FEMALE", "berth_preference": "MIDDLE", "nationality": "INDIAN", "id_type": "AADHAAR", "id_number_masked": "XXXX-XXXX-4521"},
    {"full_name": "Ramesh Sharma", "age": 62, "gender": "MALE", "berth_preference": "LOWER", "nationality": "INDIAN", "id_type": "PAN", "id_number_masked": "XXXXX4821A"},
    {"full_name": "Shanti Sharma", "age": 58, "gender": "FEMALE", "berth_preference": "LOWER", "nationality": "INDIAN", "id_type": "AADHAAR", "id_number_masked": "XXXX-XXXX-9903"},
    {"full_name": "Rohan Sharma", "age": 7, "gender": "MALE", "berth_preference": "NO_PREFERENCE", "nationality": "INDIAN", "id_type": "BIRTH_CERTIFICATE", "id_number_masked": "XXXX-XXXX-0012"}
]
