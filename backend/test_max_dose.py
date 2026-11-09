from app.agents.prescription_agent import check_safety

# Should FLAG: 1000mg x 3 = 3000mg/day, max 2000
print(check_safety([{"medicine_name": "Metformin", "dosage": "1000mg", "times_per_day": 3}]))

# Should NOT flag: 500mg x 2 = 1000mg/day, max 2000
print(check_safety([{"medicine_name": "Metformin", "dosage": "500mg", "times_per_day": 2}]))

# Should NOT flag: no digits in dosage
print(check_safety([{"medicine_name": "Metformin", "dosage": "", "times_per_day": 2}]))