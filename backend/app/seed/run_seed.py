import random
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.models import (
    User, Station, Train, TrainStation, Coach, Seat, TrainFare,
    Passenger, Booking, BookingPassenger, BookingStatus, SeatReservation,
    Payment, PaymentStatus, Refund, RefundStatus, PNRRecord, Notification,
    FavouriteRoute, LiveTrainStatus, AuditLog
)
from app.seed.seed_data import DEMO_STATIONS, DEMO_USERS, DEMO_PASSENGER_PROFILES

TRAIN_DEFINITIONS = [
    {
        "train_number": "12951",
        "name": "Mumbai Rajdhani Express",
        "train_type": "RAJDHANI",
        "source": "BCT",
        "dest": "NDLS",
        "distance": 1386.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "BCT", "arr": None, "dep": "17:00", "day": 0, "pf": "1", "km": 0.0, "halt": 0},
            {"code": "ST", "arr": "19:53", "dep": "19:58", "day": 0, "pf": "1", "km": 263.0, "halt": 5},
            {"code": "BRC", "arr": "21:14", "dep": "21:24", "day": 0, "pf": "2", "km": 392.0, "halt": 10},
            {"code": "RTM", "arr": "00:45", "dep": "00:50", "day": 1, "pf": "4", "km": 653.0, "halt": 5},
            {"code": "KOTA", "arr": "03:15", "dep": "03:20", "day": 1, "pf": "1", "km": 920.0, "halt": 5},
            {"code": "NDLS", "arr": "08:35", "dep": None, "day": 1, "pf": "2", "km": 1386.0, "halt": 0},
        ],
        "classes": {"1A": 4850.0, "2A": 3120.0, "3A": 2150.0, "SL": 850.0}
    },
    {
        "train_number": "12952",
        "name": "New Delhi - Mumbai Rajdhani",
        "train_type": "RAJDHANI",
        "source": "NDLS",
        "dest": "BCT",
        "distance": 1386.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "NDLS", "arr": None, "dep": "16:55", "day": 0, "pf": "2", "km": 0.0, "halt": 0},
            {"code": "KOTA", "arr": "21:30", "dep": "21:40", "day": 0, "pf": "1", "km": 466.0, "halt": 10},
            {"code": "RTM", "arr": "00:25", "dep": "00:28", "day": 1, "pf": "4", "km": 733.0, "halt": 3},
            {"code": "BRC", "arr": "03:45", "dep": "03:55", "day": 1, "pf": "1", "km": 994.0, "halt": 10},
            {"code": "ST", "arr": "05:15", "dep": "05:20", "day": 1, "pf": "1", "km": 1123.0, "halt": 5},
            {"code": "BCT", "arr": "08:35", "dep": None, "day": 1, "pf": "1", "km": 1386.0, "halt": 0},
        ],
        "classes": {"1A": 4850.0, "2A": 3120.0, "3A": 2150.0, "SL": 850.0}
    },
    {
        "train_number": "20901",
        "name": "Mumbai - Ahmedabad Vande Bharat Express",
        "train_type": "VANDE_BHARAT",
        "source": "BCT",
        "dest": "ADI",
        "distance": 491.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT",
        "catering": True,
        "stops": [
            {"code": "BCT", "arr": None, "dep": "06:00", "day": 0, "pf": "5", "km": 0.0, "halt": 0},
            {"code": "ST", "arr": "08:37", "dep": "08:40", "day": 0, "pf": "1", "km": 263.0, "halt": 3},
            {"code": "BRC", "arr": "09:56", "dep": "09:59", "day": 0, "pf": "3", "km": 392.0, "halt": 3},
            {"code": "ADI", "arr": "11:25", "dep": None, "day": 0, "pf": "8", "km": 491.0, "halt": 0},
        ],
        "classes": {"EC": 2510.0, "CC": 1365.0}
    },
    {
        "train_number": "20902",
        "name": "Ahmedabad - Mumbai Vande Bharat Express",
        "train_type": "VANDE_BHARAT",
        "source": "ADI",
        "dest": "BCT",
        "distance": 491.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT",
        "catering": True,
        "stops": [
            {"code": "ADI", "arr": None, "dep": "15:00", "day": 0, "pf": "8", "km": 0.0, "halt": 0},
            {"code": "BRC", "arr": "16:05", "dep": "16:08", "day": 0, "pf": "3", "km": 99.0, "halt": 3},
            {"code": "ST", "arr": "17:28", "dep": "17:33", "day": 0, "pf": "1", "km": 228.0, "halt": 5},
            {"code": "BCT", "arr": "20:25", "dep": None, "day": 0, "pf": "5", "km": 491.0, "halt": 0},
        ],
        "classes": {"EC": 2510.0, "CC": 1365.0}
    },
    {
        "train_number": "12009",
        "name": "Mumbai - Ahmedabad Shatabdi Express",
        "train_type": "SHATABDI",
        "source": "BCT",
        "dest": "ADI",
        "distance": 491.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT",
        "catering": True,
        "stops": [
            {"code": "BCT", "arr": None, "dep": "06:20", "day": 0, "pf": "1", "km": 0.0, "halt": 0},
            {"code": "ST", "arr": "09:12", "dep": "09:17", "day": 0, "pf": "1", "km": 263.0, "halt": 5},
            {"code": "BRC", "arr": "10:38", "dep": "10:43", "day": 0, "pf": "2", "km": 392.0, "halt": 5},
            {"code": "ADI", "arr": "12:45", "dep": None, "day": 0, "pf": "1", "km": 491.0, "halt": 0},
        ],
        "classes": {"EC": 2040.0, "CC": 1055.0}
    },
    {
        "train_number": "12123",
        "name": "Deccan Queen Superfast",
        "train_type": "SUPERFAST",
        "source": "CSMT",
        "dest": "PUNE",
        "distance": 192.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "CSMT", "arr": None, "dep": "17:10", "day": 0, "pf": "8", "km": 0.0, "halt": 0},
            {"code": "LNL", "arr": "19:18", "dep": "19:20", "day": 0, "pf": "1", "km": 128.0, "halt": 2},
            {"code": "PUNE", "arr": "20:25", "dep": None, "day": 0, "pf": "5", "km": 192.0, "halt": 0},
        ],
        "classes": {"CC": 390.0, "2S": 115.0}
    },
    {
        "train_number": "12124",
        "name": "Pune - Mumbai Deccan Queen",
        "train_type": "SUPERFAST",
        "source": "PUNE",
        "dest": "CSMT",
        "distance": 192.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "PUNE", "arr": None, "dep": "07:15", "day": 0, "pf": "5", "km": 0.0, "halt": 0},
            {"code": "LNL", "arr": "08:14", "dep": "08:15", "day": 0, "pf": "2", "km": 64.0, "halt": 1},
            {"code": "CSMT", "arr": "10:25", "dep": None, "day": 0, "pf": "8", "km": 192.0, "halt": 0},
        ],
        "classes": {"CC": 390.0, "2S": 115.0}
    },
    {
        "train_number": "12004",
        "name": "Lucknow Shatabdi Express",
        "train_type": "SHATABDI",
        "source": "NDLS",
        "dest": "LKO",
        "distance": 512.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "NDLS", "arr": None, "dep": "06:10", "day": 0, "pf": "1", "km": 0.0, "halt": 0},
            {"code": "CNB", "arr": "11:20", "dep": "11:25", "day": 0, "pf": "1", "km": 440.0, "halt": 5},
            {"code": "LKO", "arr": "12:55", "dep": None, "day": 0, "pf": "2", "km": 512.0, "halt": 0},
        ],
        "classes": {"EC": 2150.0, "CC": 1165.0}
    },
    {
        "train_number": "12003",
        "name": "Lucknow - New Delhi Shatabdi Express",
        "train_type": "SHATABDI",
        "source": "LKO",
        "dest": "NDLS",
        "distance": 512.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "LKO", "arr": None, "dep": "15:30", "day": 0, "pf": "2", "km": 0.0, "halt": 0},
            {"code": "CNB", "arr": "16:50", "dep": "16:55", "day": 0, "pf": "1", "km": 72.0, "halt": 5},
            {"code": "NDLS", "arr": "22:20", "dep": None, "day": 0, "pf": "1", "km": 512.0, "halt": 0},
        ],
        "classes": {"EC": 2150.0, "CC": 1165.0}
    },
    {
        "train_number": "22436",
        "name": "New Delhi - Varanasi Vande Bharat Express",
        "train_type": "VANDE_BHARAT",
        "source": "NDLS",
        "dest": "BSB",
        "distance": 759.0,
        "runs_on": "TUE,WED,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "NDLS", "arr": None, "dep": "06:00", "day": 0, "pf": "16", "km": 0.0, "halt": 0},
            {"code": "CNB", "arr": "10:08", "dep": "10:10", "day": 0, "pf": "1", "km": 440.0, "halt": 2},
            {"code": "PRYJ", "arr": "12:08", "dep": "12:10", "day": 0, "pf": "6", "km": 634.0, "halt": 2},
            {"code": "BSB", "arr": "14:00", "dep": None, "day": 0, "pf": "1", "km": 759.0, "halt": 0},
        ],
        "classes": {"EC": 3310.0, "CC": 1750.0}
    },
    {
        "train_number": "12015",
        "name": "Ajmer Shatabdi Express",
        "train_type": "SHATABDI",
        "source": "NDLS",
        "dest": "AII",
        "distance": 443.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "NDLS", "arr": None, "dep": "06:10", "day": 0, "pf": "10", "km": 0.0, "halt": 0},
            {"code": "JP", "arr": "10:40", "dep": "10:45", "day": 0, "pf": "1", "km": 308.0, "halt": 5},
            {"code": "AII", "arr": "12:55", "dep": None, "day": 0, "pf": "3", "km": 443.0, "halt": 0},
        ],
        "classes": {"EC": 1940.0, "CC": 995.0}
    },
    {
        "train_number": "12016",
        "name": "Ajmer - New Delhi Shatabdi Express",
        "train_type": "SHATABDI",
        "source": "AII",
        "dest": "NDLS",
        "distance": 443.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "AII", "arr": None, "dep": "15:55", "day": 0, "pf": "3", "km": 0.0, "halt": 0},
            {"code": "JP", "arr": "17:40", "dep": "17:45", "day": 0, "pf": "1", "km": 135.0, "halt": 5},
            {"code": "NDLS", "arr": "22:30", "dep": None, "day": 0, "pf": "10", "km": 443.0, "halt": 0},
        ],
        "classes": {"EC": 1940.0, "CC": 995.0}
    },
    {
        "train_number": "12301",
        "name": "Howrah Rajdhani Express",
        "train_type": "RAJDHANI",
        "source": "HWH",
        "dest": "NDLS",
        "distance": 1450.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT",
        "catering": True,
        "stops": [
            {"code": "HWH", "arr": None, "dep": "16:50", "day": 0, "pf": "9", "km": 0.0, "halt": 0},
            {"code": "ASN", "arr": "18:57", "dep": "19:00", "day": 0, "pf": "4", "km": 200.0, "halt": 3},
            {"code": "GAYA", "arr": "22:19", "dep": "22:22", "day": 0, "pf": "1", "km": 459.0, "halt": 3},
            {"code": "PRYJ", "arr": "02:33", "dep": "02:35", "day": 1, "pf": "1", "km": 809.0, "halt": 2},
            {"code": "CNB", "arr": "04:40", "dep": "04:45", "day": 1, "pf": "1", "km": 1003.0, "halt": 5},
            {"code": "NDLS", "arr": "10:05", "dep": None, "day": 1, "pf": "4", "km": 1450.0, "halt": 0},
        ],
        "classes": {"1A": 5050.0, "2A": 3280.0, "3A": 2240.0}
    },
    {
        "train_number": "12302",
        "name": "New Delhi - Howrah Rajdhani Express",
        "train_type": "RAJDHANI",
        "source": "NDLS",
        "dest": "HWH",
        "distance": 1450.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SUN",
        "catering": True,
        "stops": [
            {"code": "NDLS", "arr": None, "dep": "16:55", "day": 0, "pf": "4", "km": 0.0, "halt": 0},
            {"code": "CNB", "arr": "21:32", "dep": "21:37", "day": 0, "pf": "1", "km": 447.0, "halt": 5},
            {"code": "PRYJ", "arr": "23:43", "dep": "23:45", "day": 0, "pf": "1", "km": 641.0, "halt": 2},
            {"code": "GAYA", "arr": "03:58", "dep": "04:01", "day": 1, "pf": "1", "km": 991.0, "halt": 3},
            {"code": "ASN", "arr": "07:26", "dep": "07:28", "day": 1, "pf": "4", "km": 1250.0, "halt": 2},
            {"code": "HWH", "arr": "09:55", "dep": None, "day": 1, "pf": "9", "km": 1450.0, "halt": 0},
        ],
        "classes": {"1A": 5050.0, "2A": 3280.0, "3A": 2240.0}
    },
    {
        "train_number": "12007",
        "name": "Chennai - Bengaluru Shatabdi Express",
        "train_type": "SHATABDI",
        "source": "MAS",
        "dest": "SBC",
        "distance": 358.0,
        "runs_on": "MON,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "MAS", "arr": None, "dep": "06:00", "day": 0, "pf": "2", "km": 0.0, "halt": 0},
            {"code": "SBC", "arr": "10:55", "dep": None, "day": 0, "pf": "7", "km": 358.0, "halt": 0},
        ],
        "classes": {"EC": 1820.0, "CC": 930.0}
    },
    {
        "train_number": "12008",
        "name": "Bengaluru - Chennai Shatabdi Express",
        "train_type": "SHATABDI",
        "source": "SBC",
        "dest": "MAS",
        "distance": 358.0,
        "runs_on": "MON,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "SBC", "arr": None, "dep": "16:20", "day": 0, "pf": "7", "km": 0.0, "halt": 0},
            {"code": "MAS", "arr": "21:30", "dep": None, "day": 0, "pf": "2", "km": 358.0, "halt": 0},
        ],
        "classes": {"EC": 1820.0, "CC": 930.0}
    },
    {
        "train_number": "20607",
        "name": "Chennai - Mysuru Vande Bharat Express",
        "train_type": "VANDE_BHARAT",
        "source": "MAS",
        "dest": "SBC",
        "distance": 358.0,
        "runs_on": "MON,TUE,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "MAS", "arr": None, "dep": "05:50", "day": 0, "pf": "6", "km": 0.0, "halt": 0},
            {"code": "SBC", "arr": "10:20", "dep": None, "day": 0, "pf": "1", "km": 358.0, "halt": 0},
        ],
        "classes": {"EC": 1950.0, "CC": 1010.0}
    },
    {
        "train_number": "12675",
        "name": "Kovai Superfast Express",
        "train_type": "SUPERFAST",
        "source": "MAS",
        "dest": "CBE",
        "distance": 496.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "MAS", "arr": None, "dep": "06:10", "day": 0, "pf": "3", "km": 0.0, "halt": 0},
            {"code": "CBE", "arr": "14:05", "dep": None, "day": 0, "pf": "2", "km": 496.0, "halt": 0},
        ],
        "classes": {"CC": 710.0, "2S": 205.0}
    },
    {
        "train_number": "12219",
        "name": "Secunderabad - Mumbai Duronto Express",
        "train_type": "SUPERFAST",
        "source": "SC",
        "dest": "CSMT",
        "distance": 792.0,
        "runs_on": "TUE,FRI",
        "catering": True,
        "stops": [
            {"code": "SC", "arr": None, "dep": "23:05", "day": 0, "pf": "3", "km": 0.0, "halt": 0},
            {"code": "PUNE", "arr": "07:50", "dep": "07:55", "day": 1, "pf": "1", "km": 597.0, "halt": 5},
            {"code": "CSMT", "arr": "11:05", "dep": None, "day": 1, "pf": "14", "km": 792.0, "halt": 0},
        ],
        "classes": {"1A": 3720.0, "2A": 2290.0, "3A": 1620.0, "SL": 630.0}
    },
    {
        "train_number": "12220",
        "name": "Mumbai - Secunderabad Duronto Express",
        "train_type": "SUPERFAST",
        "source": "CSMT",
        "dest": "SC",
        "distance": 792.0,
        "runs_on": "WED,SAT",
        "catering": True,
        "stops": [
            {"code": "CSMT", "arr": None, "dep": "23:05", "day": 0, "pf": "14", "km": 0.0, "halt": 0},
            {"code": "PUNE", "arr": "02:10", "dep": "02:15", "day": 1, "pf": "2", "km": 192.0, "halt": 5},
            {"code": "SC", "arr": "11:10", "dep": None, "day": 1, "pf": "3", "km": 792.0, "halt": 0},
        ],
        "classes": {"1A": 3720.0, "2A": 2290.0, "3A": 1620.0, "SL": 630.0}
    },
    {
        "train_number": "12759",
        "name": "Charminar Express",
        "train_type": "SUPERFAST",
        "source": "HYB",
        "dest": "MAS",
        "distance": 790.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "HYB", "arr": None, "dep": "18:00", "day": 0, "pf": "5", "km": 0.0, "halt": 0},
            {"code": "SC", "arr": "18:20", "dep": "18:25", "day": 0, "pf": "1", "km": 10.0, "halt": 5},
            {"code": "BZA", "arr": "23:45", "dep": "23:55", "day": 0, "pf": "7", "km": 360.0, "halt": 10},
            {"code": "MAS", "arr": "08:15", "dep": None, "day": 1, "pf": "8", "km": 790.0, "halt": 0},
        ],
        "classes": {"1A": 3650.0, "2A": 2180.0, "3A": 1540.0, "SL": 580.0}
    },
    {
        "train_number": "12760",
        "name": "Charminar Superfast Express",
        "train_type": "SUPERFAST",
        "source": "MAS",
        "dest": "HYB",
        "distance": 790.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "MAS", "arr": None, "dep": "17:40", "day": 0, "pf": "8", "km": 0.0, "halt": 0},
            {"code": "BZA", "arr": "00:05", "dep": "00:15", "day": 1, "pf": "6", "km": 430.0, "halt": 10},
            {"code": "SC", "arr": "06:20", "dep": "06:25", "day": 1, "pf": "1", "km": 780.0, "halt": 5},
            {"code": "HYB", "arr": "08:00", "dep": None, "day": 1, "pf": "5", "km": 790.0, "halt": 0},
        ],
        "classes": {"1A": 3650.0, "2A": 2180.0, "3A": 1540.0, "SL": 580.0}
    },
    {
        "train_number": "12723",
        "name": "Telangana Express",
        "train_type": "SUPERFAST",
        "source": "HYB",
        "dest": "NDLS",
        "distance": 1677.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "HYB", "arr": None, "dep": "06:00", "day": 0, "pf": "6", "km": 0.0, "halt": 0},
            {"code": "SC", "arr": "06:20", "dep": "06:25", "day": 0, "pf": "2", "km": 10.0, "halt": 5},
            {"code": "NGP", "arr": "15:20", "dep": "15:25", "day": 0, "pf": "4", "km": 585.0, "halt": 5},
            {"code": "BPL", "arr": "21:45", "dep": "21:55", "day": 0, "pf": "2", "km": 975.0, "halt": 10},
            {"code": "AGC", "arr": "05:00", "dep": "05:05", "day": 1, "pf": "1", "km": 1482.0, "halt": 5},
            {"code": "NDLS", "arr": "07:40", "dep": None, "day": 1, "pf": "9", "km": 1677.0, "halt": 0},
        ],
        "classes": {"1A": 4900.0, "2A": 2980.0, "3A": 2040.0, "SL": 760.0}
    },
    {
        "train_number": "12724",
        "name": "Telangana Superfast Express",
        "train_type": "SUPERFAST",
        "source": "NDLS",
        "dest": "HYB",
        "distance": 1677.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "NDLS", "arr": None, "dep": "16:00", "day": 0, "pf": "9", "km": 0.0, "halt": 0},
            {"code": "AGC", "arr": "18:05", "dep": "18:07", "day": 0, "pf": "1", "km": 195.0, "halt": 2},
            {"code": "BPL", "arr": "01:20", "dep": "01:30", "day": 1, "pf": "1", "km": 702.0, "halt": 10},
            {"code": "NGP", "arr": "07:10", "dep": "07:15", "day": 1, "pf": "2", "km": 1092.0, "halt": 5},
            {"code": "SC", "arr": "15:55", "dep": "16:00", "day": 1, "pf": "1", "km": 1667.0, "halt": 5},
            {"code": "HYB", "arr": "17:10", "dep": None, "day": 1, "pf": "6", "km": 1677.0, "halt": 0},
        ],
        "classes": {"1A": 4900.0, "2A": 2980.0, "3A": 2040.0, "SL": 760.0}
    },
    {
        "train_number": "12417",
        "name": "Prayagraj Express",
        "train_type": "SUPERFAST",
        "source": "PRYJ",
        "dest": "NDLS",
        "distance": 634.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": False,
        "stops": [
            {"code": "PRYJ", "arr": None, "dep": "22:10", "day": 0, "pf": "1", "km": 0.0, "halt": 0},
            {"code": "CNB", "arr": "00:25", "dep": "00:30", "day": 1, "pf": "1", "km": 194.0, "halt": 5},
            {"code": "NDLS", "arr": "07:00", "dep": None, "day": 1, "pf": "14", "km": 634.0, "halt": 0},
        ],
        "classes": {"1A": 2680.0, "2A": 1610.0, "3A": 1140.0, "SL": 430.0}
    },
    {
        "train_number": "12418",
        "name": "Prayagraj Superfast",
        "train_type": "SUPERFAST",
        "source": "NDLS",
        "dest": "PRYJ",
        "distance": 634.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": False,
        "stops": [
            {"code": "NDLS", "arr": None, "dep": "22:10", "day": 0, "pf": "14", "km": 0.0, "halt": 0},
            {"code": "CNB", "arr": "03:50", "dep": "03:55", "day": 1, "pf": "2", "km": 440.0, "halt": 5},
            {"code": "PRYJ", "arr": "07:00", "dep": None, "day": 1, "pf": "1", "km": 634.0, "halt": 0},
        ],
        "classes": {"1A": 2680.0, "2A": 1610.0, "3A": 1140.0, "SL": 430.0}
    },
    {
        "train_number": "12045",
        "name": "New Delhi - Chandigarh Shatabdi",
        "train_type": "SHATABDI",
        "source": "NDLS",
        "dest": "CDG",
        "distance": 266.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT",
        "catering": True,
        "stops": [
            {"code": "NDLS", "arr": None, "dep": "19:15", "day": 0, "pf": "2", "km": 0.0, "halt": 0},
            {"code": "CDG", "arr": "22:35", "dep": None, "day": 0, "pf": "1", "km": 266.0, "halt": 0},
        ],
        "classes": {"EC": 1490.0, "CC": 775.0}
    },
    {
        "train_number": "12046",
        "name": "Chandigarh - New Delhi Shatabdi",
        "train_type": "SHATABDI",
        "source": "CDG",
        "dest": "NDLS",
        "distance": 266.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT",
        "catering": True,
        "stops": [
            {"code": "CDG", "arr": None, "dep": "12:05", "day": 0, "pf": "1", "km": 0.0, "halt": 0},
            {"code": "NDLS", "arr": "15:20", "dep": None, "day": 0, "pf": "2", "km": 266.0, "halt": 0},
        ],
        "classes": {"EC": 1490.0, "CC": 775.0}
    },
    {
        "train_number": "12957",
        "name": "Swarna Jayanti Rajdhani",
        "train_type": "RAJDHANI",
        "source": "ADI",
        "dest": "NDLS",
        "distance": 934.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "ADI", "arr": None, "dep": "17:45", "day": 0, "pf": "1", "km": 0.0, "halt": 0},
            {"code": "JP", "arr": "01:20", "dep": "01:25", "day": 1, "pf": "2", "km": 626.0, "halt": 5},
            {"code": "NDLS", "arr": "07:30", "dep": None, "day": 1, "pf": "3", "km": 934.0, "halt": 0},
        ],
        "classes": {"1A": 3950.0, "2A": 2520.0, "3A": 1780.0}
    },
    {
        "train_number": "12958",
        "name": "Swarna Jayanti Rajdhani Express",
        "train_type": "RAJDHANI",
        "source": "NDLS",
        "dest": "ADI",
        "distance": 934.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "NDLS", "arr": None, "dep": "19:55", "day": 0, "pf": "3", "km": 0.0, "halt": 0},
            {"code": "JP", "arr": "01:40", "dep": "01:45", "day": 1, "pf": "2", "km": 308.0, "halt": 5},
            {"code": "ADI", "arr": "09:30", "dep": None, "day": 1, "pf": "1", "km": 934.0, "halt": 0},
        ],
        "classes": {"1A": 3950.0, "2A": 2520.0, "3A": 1780.0}
    },
    {
        "train_number": "12555",
        "name": "Gorakhdham Superfast Express",
        "train_type": "SUPERFAST",
        "source": "GKP",
        "dest": "NDLS",
        "distance": 782.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "GKP", "arr": None, "dep": "16:35", "day": 0, "pf": "1", "km": 0.0, "halt": 0},
            {"code": "LKO", "arr": "21:20", "dep": "21:30", "day": 0, "pf": "3", "km": 270.0, "halt": 10},
            {"code": "CNB", "arr": "23:18", "dep": "23:23", "day": 0, "pf": "2", "km": 342.0, "halt": 5},
            {"code": "NDLS", "arr": "05:30", "dep": None, "day": 1, "pf": "6", "km": 782.0, "halt": 0},
        ],
        "classes": {"1A": 2980.0, "2A": 1820.0, "3A": 1280.0, "SL": 490.0}
    },
    {
        "train_number": "12157",
        "name": "Hutatma Superfast Express",
        "train_type": "SUPERFAST",
        "source": "PUNE",
        "dest": "SUR",
        "distance": 262.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": False,
        "stops": [
            {"code": "PUNE", "arr": None, "dep": "18:00", "day": 0, "pf": "3", "km": 0.0, "halt": 0},
            {"code": "SUR", "arr": "22:00", "dep": None, "day": 0, "pf": "1", "km": 262.0, "halt": 0},
        ],
        "classes": {"CC": 460.0, "2S": 130.0}
    },
    {
        "train_number": "12137",
        "name": "Punjab Mail Superfast Express",
        "train_type": "SUPERFAST",
        "source": "CSMT",
        "dest": "DLI",
        "distance": 1541.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "CSMT", "arr": None, "dep": "19:35", "day": 0, "pf": "18", "km": 0.0, "halt": 0},
            {"code": "TNA", "arr": "20:03", "dep": "20:05", "day": 0, "pf": "5", "km": 34.0, "halt": 2},
            {"code": "NK", "arr": "23:00", "dep": "23:05", "day": 0, "pf": "2", "km": 187.0, "halt": 5},
            {"code": "BSL", "arr": "02:25", "dep": "02:30", "day": 1, "pf": "6", "km": 443.0, "halt": 5},
            {"code": "BPL", "arr": "09:05", "dep": "09:10", "day": 1, "pf": "2", "km": 837.0, "halt": 5},
            {"code": "GWL", "arr": "14:15", "dep": "14:20", "day": 1, "pf": "4", "km": 1228.0, "halt": 5},
            {"code": "AGC", "arr": "17:50", "dep": "17:55", "day": 1, "pf": "1", "km": 1346.0, "halt": 5},
            {"code": "NDLS", "arr": "21:10", "dep": "21:25", "day": 1, "pf": "3", "km": 1541.0, "halt": 15},
            {"code": "DLI", "arr": "21:50", "dep": None, "day": 1, "pf": "5", "km": 1548.0, "halt": 0},
        ],
        "classes": {"1A": 3600.0, "2A": 2250.0, "3A": 1550.0, "SL": 590.0}
    },
    {
        "train_number": "12138",
        "name": "Punjab Mail Superfast",
        "train_type": "SUPERFAST",
        "source": "DLI",
        "dest": "CSMT",
        "distance": 1541.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "DLI", "arr": None, "dep": "05:15", "day": 0, "pf": "5", "km": 0.0, "halt": 0},
            {"code": "NDLS", "arr": "05:35", "dep": "05:50", "day": 0, "pf": "3", "km": 7.0, "halt": 15},
            {"code": "AGC", "arr": "08:15", "dep": "08:20", "day": 0, "pf": "1", "km": 202.0, "halt": 5},
            {"code": "GWL", "arr": "10:05", "dep": "10:10", "day": 0, "pf": "4", "km": 320.0, "halt": 5},
            {"code": "BPL", "arr": "16:40", "dep": "16:45", "day": 0, "pf": "2", "km": 711.0, "halt": 5},
            {"code": "BSL", "arr": "23:25", "dep": "23:30", "day": 0, "pf": "6", "km": 1105.0, "halt": 5},
            {"code": "NK", "arr": "02:35", "dep": "02:40", "day": 1, "pf": "2", "km": 1361.0, "halt": 5},
            {"code": "TNA", "arr": "06:47", "dep": "06:50", "day": 1, "pf": "5", "km": 1514.0, "halt": 3},
            {"code": "CSMT", "arr": "07:35", "dep": None, "day": 1, "pf": "18", "km": 1548.0, "halt": 0},
        ],
        "classes": {"1A": 3600.0, "2A": 2250.0, "3A": 1550.0, "SL": 590.0}
    },
    {
        "train_number": "12051",
        "name": "Mumbai - Madgaon Jan Shatabdi Express",
        "train_type": "SHATABDI",
        "source": "CSMT",
        "dest": "MAO",
        "distance": 571.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "CSMT", "arr": None, "dep": "05:10", "day": 0, "pf": "12", "km": 0.0, "halt": 0},
            {"code": "TNA", "arr": "05:43", "dep": "05:45", "day": 0, "pf": "7", "km": 34.0, "halt": 2},
            {"code": "PNVL", "arr": "06:23", "dep": "06:25", "day": 0, "pf": "5", "km": 67.0, "halt": 2},
            {"code": "MAO", "arr": "14:30", "dep": None, "day": 0, "pf": "2", "km": 571.0, "halt": 0},
        ],
        "classes": {"CC": 950.0, "2S": 290.0}
    },
    {
        "train_number": "12052",
        "name": "Madgaon - Mumbai Jan Shatabdi Express",
        "train_type": "SHATABDI",
        "source": "MAO",
        "dest": "CSMT",
        "distance": 571.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "MAO", "arr": None, "dep": "15:05", "day": 0, "pf": "2", "km": 0.0, "halt": 0},
            {"code": "PNVL", "arr": "22:18", "dep": "22:20", "day": 0, "pf": "5", "km": 504.0, "halt": 2},
            {"code": "TNA", "arr": "22:58", "dep": "23:00", "day": 0, "pf": "7", "km": 537.0, "halt": 2},
            {"code": "CSMT", "arr": "23:55", "dep": None, "day": 0, "pf": "12", "km": 571.0, "halt": 0},
        ],
        "classes": {"CC": 950.0, "2S": 290.0}
    },
    {
        "train_number": "11301",
        "name": "Udyan Express",
        "train_type": "EXPRESS",
        "source": "CSMT",
        "dest": "SBC",
        "distance": 1134.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "CSMT", "arr": None, "dep": "08:10", "day": 0, "pf": "17", "km": 0.0, "halt": 0},
            {"code": "TNA", "arr": "08:48", "dep": "08:50", "day": 0, "pf": "5", "km": 34.0, "halt": 2},
            {"code": "PUNE", "arr": "11:40", "dep": "11:45", "day": 0, "pf": "1", "km": 192.0, "halt": 5},
            {"code": "SUR", "arr": "16:00", "dep": "16:05", "day": 0, "pf": "3", "km": 454.0, "halt": 5},
            {"code": "SBC", "arr": "06:00", "dep": None, "day": 1, "pf": "4", "km": 1134.0, "halt": 0},
        ],
        "classes": {"1A": 3200.0, "2A": 2100.0, "3A": 1450.0, "SL": 540.0}
    },
    {
        "train_number": "11302",
        "name": "Udyan Express Superfast",
        "train_type": "EXPRESS",
        "source": "SBC",
        "dest": "CSMT",
        "distance": 1134.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "SBC", "arr": None, "dep": "20:45", "day": 0, "pf": "4", "km": 0.0, "halt": 0},
            {"code": "SUR", "arr": "10:35", "dep": "10:40", "day": 1, "pf": "3", "km": 680.0, "halt": 5},
            {"code": "PUNE", "arr": "15:20", "dep": "15:25", "day": 1, "pf": "1", "km": 942.0, "halt": 5},
            {"code": "TNA", "arr": "18:58", "dep": "19:00", "day": 1, "pf": "5", "km": 1100.0, "halt": 2},
            {"code": "CSMT", "arr": "19:45", "dep": None, "day": 1, "pf": "17", "km": 1134.0, "halt": 0},
        ],
        "classes": {"1A": 3200.0, "2A": 2100.0, "3A": 1450.0, "SL": 540.0}
    },
    {
        "train_number": "12701",
        "name": "Hussainsagar Superfast Express",
        "train_type": "SUPERFAST",
        "source": "CSMT",
        "dest": "HYB",
        "distance": 790.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "CSMT", "arr": None, "dep": "21:50", "day": 0, "pf": "16", "km": 0.0, "halt": 0},
            {"code": "TNA", "arr": "22:28", "dep": "22:30", "day": 0, "pf": "5", "km": 34.0, "halt": 2},
            {"code": "PUNE", "arr": "01:20", "dep": "01:25", "day": 1, "pf": "2", "km": 192.0, "halt": 5},
            {"code": "SUR", "arr": "05:30", "dep": "05:35", "day": 1, "pf": "1", "km": 454.0, "halt": 5},
            {"code": "HYB", "arr": "12:05", "dep": None, "day": 1, "pf": "4", "km": 790.0, "halt": 0},
        ],
        "classes": {"2A": 1950.0, "3A": 1350.0, "SL": 510.0}
    },
    {
        "train_number": "12702",
        "name": "Hussainsagar Express",
        "train_type": "SUPERFAST",
        "source": "HYB",
        "dest": "CSMT",
        "distance": 790.0,
        "runs_on": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "catering": True,
        "stops": [
            {"code": "HYB", "arr": None, "dep": "14:50", "day": 0, "pf": "4", "km": 0.0, "halt": 0},
            {"code": "SUR", "arr": "21:25", "dep": "21:30", "day": 0, "pf": "1", "km": 336.0, "halt": 5},
            {"code": "PUNE", "arr": "01:05", "dep": "01:10", "day": 1, "pf": "2", "km": 598.0, "halt": 5},
            {"code": "TNA", "arr": "04:08", "dep": "04:10", "day": 1, "pf": "5", "km": 756.0, "halt": 2},
            {"code": "CSMT", "arr": "04:55", "dep": None, "day": 1, "pf": "16", "km": 790.0, "halt": 0},
        ],
        "classes": {"2A": 1950.0, "3A": 1350.0, "SL": 510.0}
    }
]

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        print("1. Seeding 50+ Railway Stations...")
        station_map = {}
        for s_data in DEMO_STATIONS:
            station = Station(
                code=s_data["code"],
                name=s_data["name"],
                city=s_data["city"],
                state=s_data["state"],
                zone=s_data.get("zone", "IR"),
                has_wifi=True,
                has_waiting_room=True,
                has_food_court=True,
                is_active=True
            )
            db.add(station)
            db.flush()
            station_map[s_data["code"]] = station

        print("2. Seeding 10 Demo Users & Profiles...")
        user_objects = []
        for u in DEMO_USERS:
            user = User(
                email=u["email"],
                mobile=u["mobile"],
                hashed_password=get_password_hash(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                gender=u["gender"],
                dob=u["dob"],
                address=u["address"],
                is_active=True
            )
            db.add(user)
            db.flush()
            user_objects.append(user)

        main_user = user_objects[0] # user@railone.demo

        print("3. Seeding Saved Passengers for Main Demo User...")
        for p in DEMO_PASSENGER_PROFILES:
            pass_obj = Passenger(
                user_id=main_user.id,
                full_name=p["full_name"],
                age=p["age"],
                gender=p["gender"],
                berth_preference=p["berth_preference"],
                nationality=p["nationality"],
                id_type=p["id_type"],
                id_number_masked=p["id_number_masked"]
            )
            db.add(pass_obj)

        print("4. Seeding 32 Trains, Schedules, Coaches & Seats...")
        created_trains = []
        berth_cycle = ["LOWER", "MIDDLE", "UPPER", "SIDE_LOWER", "SIDE_UPPER"]

        for t_def in TRAIN_DEFINITIONS:
            src_station = station_map.get(t_def["source"])
            dst_station = station_map.get(t_def["dest"])
            if not src_station or not dst_station:
                continue

            train = Train(
                train_number=t_def["train_number"],
                name=t_def["name"],
                train_type=t_def["train_type"],
                source_station_id=src_station.id,
                destination_station_id=dst_station.id,
                runs_on_days=t_def["runs_on"],
                total_distance_km=t_def["distance"],
                catering_available=t_def["catering"],
                is_active=True
            )
            db.add(train)
            db.flush()
            created_trains.append(train)

            # Add schedules
            for idx, stop in enumerate(t_def["stops"]):
                st = station_map.get(stop["code"])
                if not st:
                    continue
                ts = TrainStation(
                    train_id=train.id,
                    station_id=st.id,
                    stop_number=idx + 1,
                    arrival_time=stop["arr"],
                    departure_time=stop["dep"],
                    day_offset=stop["day"],
                    platform_number=stop["pf"],
                    distance_from_source_km=stop["km"],
                    halt_duration_mins=stop["halt"]
                )
                db.add(ts)

            # Add Fares & Coaches
            prefix_map = {"1A": "H", "2A": "A", "3A": "B", "SL": "S", "CC": "C", "EC": "E", "2S": "D"}
            for cls_code, base_price in t_def["classes"].items():
                # Add fare
                tf = TrainFare(
                    train_id=train.id,
                    coach_class=cls_code,
                    base_fare=base_price,
                    tatkal_surcharge=base_price * 0.25,
                    superfast_surcharge=45.0,
                    gst_percent=5.0
                )
                db.add(tf)

                # Create 2 coaches per class for realism
                for c_num in range(1, 3):
                    coach_prefix = prefix_map.get(cls_code, "C")
                    coach_code = f"{coach_prefix}{c_num}"
                    coach = Coach(
                        train_id=train.id,
                        coach_code=coach_code,
                        coach_class=cls_code,
                        seat_capacity=36  # manageable realistic seat pool per coach
                    )
                    db.add(coach)
                    db.flush()

                    # Add 36 seats
                    for s_num in range(1, 37):
                        berth = "WINDOW" if cls_code in ("CC", "2S", "EC") and s_num % 3 == 0 else berth_cycle[s_num % len(berth_cycle)]
                        seat = Seat(
                            coach_id=coach.id,
                            seat_number=s_num,
                            berth_type=berth
                        )
                        db.add(seat)

        db.flush()

        print("5. Seeding 20+ Demo Bookings, PNRs, Payments & Refunds...")
        today = date.today()
        # Seed bookings across past and future dates
        pnr_base = 2489100000
        first_train = created_trains[0] # Rajdhani
        pune_train = [t for t in created_trains if t.train_number == "12123"][0] # Deccan Queen

        for b_idx in range(22):
            target_train = created_trains[b_idx % len(created_trains)]
            # Pick journey date between -10 days and +15 days
            journey_dt = today + timedelta(days=(b_idx - 6))
            user = user_objects[b_idx % len(user_objects)]
            pnr_num = str(pnr_base + b_idx)
            is_cancelled = (b_idx == 4 or b_idx == 11)
            is_past = journey_dt < today
            
            b_status = BookingStatus.CANCELLED if is_cancelled else (BookingStatus.COMPLETED if is_past else BookingStatus.CONFIRMED)
            
            # Select available coach & seat for target_train
            first_coach = db.query(Coach).filter(Coach.train_id == target_train.id).first()
            first_seat = db.query(Seat).filter(Seat.coach_id == first_coach.id).first() if first_coach else None

            fare_rec = db.query(TrainFare).filter(TrainFare.train_id == target_train.id).first()
            base_amt = fare_rec.base_fare if fare_rec else 1250.0
            tax_amt = round(base_amt * 0.05, 2)
            conv_fee = 35.40
            total_amt = round(base_amt + tax_amt + conv_fee, 2)

            booking = Booking(
                pnr=pnr_num,
                booking_id=f"RC-DEMO-{1000 + b_idx}",
                user_id=user.id,
                train_id=target_train.id,
                from_station_id=target_train.source_station_id,
                to_station_id=target_train.destination_station_id,
                journey_date=journey_dt,
                coach_class=first_coach.coach_class if first_coach else "3A",
                quota="GENERAL",
                status=b_status,
                total_passengers=1,
                base_fare=base_amt,
                taxes=tax_amt,
                convenience_fee=conv_fee,
                total_amount=total_amt,
                qr_code_data=f"PNR:{pnr_num}|TRAIN:{target_train.train_number}|DATE:{journey_dt.isoformat()}|AMT:{total_amt}",
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 14))
            )
            db.add(booking)
            db.flush()

            # Passenger
            bp = BookingPassenger(
                booking_id=booking.id,
                passenger_name=user.full_name,
                passenger_age=32,
                passenger_gender="MALE" if "Sharma" in user.full_name or "Verma" in user.full_name else "FEMALE",
                seat_id=first_seat.id if first_seat else None,
                coach_code=first_coach.coach_code if first_coach else "B1",
                seat_number=first_seat.seat_number if first_seat else 12,
                berth_type=first_seat.berth_type if first_seat else "LOWER",
                status=b_status,
                ticket_number=f"TKT-DEMO-{2000 + b_idx}"
            )
            db.add(bp)
            db.flush()

            # Seat reservation (active unless cancelled)
            if first_seat and not is_cancelled:
                sr = SeatReservation(
                    seat_id=first_seat.id,
                    journey_date=journey_dt,
                    booking_passenger_id=bp.id,
                    is_active=True
                )
                db.add(sr)

            # PNR record
            pnr_rec = PNRRecord(
                pnr=pnr_num,
                booking_id=booking.id,
                chart_status="PREPARED" if is_past or journey_dt <= today + timedelta(days=1) else "NOT_PREPARED",
                current_status=b_status
            )
            db.add(pnr_rec)

            # Payment record
            payment = Payment(
                booking_id=booking.id,
                transaction_id=f"TXN-RC-PAY-{3000 + b_idx}",
                payment_method=random.choice(["UPI", "CARD", "NET_BANKING", "WALLET"]),
                amount=total_amt,
                status=PaymentStatus.SUCCESS,
                provider_ref=f"SIM-GATEWAY-DEMO-{b_idx}"
            )
            db.add(payment)
            db.flush()

            # If cancelled, add refund
            if is_cancelled:
                cancellation_fee = 120.0
                refund = Refund(
                    booking_id=booking.id,
                    payment_id=payment.id,
                    refund_ref=f"REF-RC-DEMO-{4000 + b_idx}",
                    cancellation_fee=cancellation_fee,
                    refund_amount=total_amt - cancellation_fee,
                    status=RefundStatus.PROCESSED,
                    initiated_at=datetime.utcnow() - timedelta(hours=5),
                    processed_at=datetime.utcnow() - timedelta(hours=2)
                )
                db.add(refund)

        print("6. Seeding Notifications, Favourites & Audit Logs...")
        # Notifications for main demo user
        notifications = [
            ("BOOKING_CONFIRMED", "Ticket Confirmed! PNR 2489100000", "Your journey from CSMT to NDLS on Mumbai Rajdhani is confirmed. Coach: B1, Seat: 12."),
            ("PAYMENT_SUCCESS", "Payment Successful", "Payment of ₹2,292.90 received via UPI for booking RC-DEMO-1000."),
            ("TRAIN_DELAY", "Train Update: 12951", "Mumbai Rajdhani Express is running on time from source station."),
            ("PLATFORM_CHANGE", "Platform Information", "Train 12123 Deccan Queen will depart from Platform No. 8 at CSMT."),
            ("JOURNEY_REMINDER", "Upcoming Journey Tomorrow", "Don't forget your upcoming journey to New Delhi tomorrow. Please carry valid government ID."),
        ]
        for n_type, title, msg in notifications:
            notif = Notification(
                user_id=main_user.id,
                title=title,
                message=msg,
                type=n_type,
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
            )
            db.add(notif)

        # Favourite Routes
        fav1 = FavouriteRoute(user_id=main_user.id, from_station_id=station_map["CSMT"].id, to_station_id=station_map["NDLS"].id)
        fav2 = FavouriteRoute(user_id=main_user.id, from_station_id=station_map["CSMT"].id, to_station_id=station_map["PUNE"].id)
        fav3 = FavouriteRoute(user_id=main_user.id, from_station_id=station_map["BCT"].id, to_station_id=station_map["ADI"].id)
        db.add_all([fav1, fav2, fav3])

        # Audit Logs
        actions = [
            ("USER_LOGIN", "users", str(main_user.id), "User logged in successfully via web interface"),
            ("BOOKING_CREATED", "bookings", "RC-DEMO-1000", "Booking created for PNR 2489100000"),
            ("PAYMENT_VERIFIED", "payments", "TXN-RC-PAY-3000", "Simulated UPI payment verified"),
            ("TICKET_CANCELLED", "bookings", "RC-DEMO-1004", "User requested cancellation; refund initiated"),
            ("SYSTEM_SEED", "system", "all", "Demo dataset initialized with 50+ stations, 32 trains, 22 bookings"),
        ]
        for act, r_type, r_id, det in actions:
            log = AuditLog(
                user_id=main_user.id,
                action=act,
                resource_type=r_type,
                resource_id=r_id,
                details=det,
                ip_address="127.0.0.1"
            )
            db.add(log)

        db.commit()
        print("SEED COMPLETED SUCCESSFULLY! Database loaded with comprehensive realistic demo data.")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
