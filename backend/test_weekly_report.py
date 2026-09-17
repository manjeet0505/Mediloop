from dotenv import load_dotenv
load_dotenv(override=True)

import asyncio
from app.services.scheduler import job_generate_weekly_reports

asyncio.run(job_generate_weekly_reports())