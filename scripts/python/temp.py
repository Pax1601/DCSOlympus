import json
import difflib

countries = ['USA', 'GRG', 'GER', 'DZA', 'FRA', 'CAN', 'AUS', 'UKR', 'ITA', 'GRC', 'SPN', 'RUS', 'NETH', 'DEN', 'TUR', 'UK', 'BEL', 'ISR', 'NOR', 'JPN', 'ARE', 'QAT', 'IND', 'SAU', 'EGY', 'KOR', 'HND', 'CHL', 'BLUE', 'AUSAF', 'RED', 'VNM', 'SVK', 'SDN', 'GDR', 'JOR', 'PER', 'CHN', 'IDN', 'PHL', 'BOL', 'MAR', 'YEM', 'KWT', 'SUI', 'GHA', 'CYP', 'BHR', 'YUG', 'CZE', 'KAZ', 'AUT', 'HUN', 'MYS', 'ROU', 'THA', 'LBN', 'FIN', 'PRT', 'OMN', 'MEX', 'IRQ', 'BRA', 'SWE', 'NZG', 'CUB', 'INS', 'RSO', 'RSA', 'HRV', 'ABH', 'ARG', 'LBY', 'PRK', 'VEN', 'TUN', 'IRN', 'ETH', 'BLR', 'SUN', 'BGR', 'PAK', 'NGA', 'POL', 'SVN', 'SYR', 'SRB', 'UN', 'RSI', 'SPA', 'ECU', '', 'USAF', 'hide', 'EGP', 'LIB']

with open('C:\\Users\\dpass\\Documents\\DCSOlympus\\client\\public\\images\\nations\\codes.json', "r") as f:
    codes = json.load(f)

    for country in countries:
        keys = difflib.get_close_matches(country, codes.keys(), cutoff=.35)
        if len(keys) > 0:
            codes[keys[0]]["liveryCodes"].append(country)

with open('C:\\Users\\dpass\\Documents\\DCSOlympus\\client\\public\\images\\nations\\codes.json', "w") as f:
    json.dump(codes, f)