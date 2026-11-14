"""
Use AWS S3 as a data source for extraction.
Store as bronze level data, in folder s3/bronze/
"""

from fastf1 import get_session

def extract(source: str) -> str:
    # Extract data from fastf1 API and put in s3 bucket in the bronze folder
    # Verify the source is valid, and the data written is less than 1 GB

    # Start the extraction process
    session = get_session(2023, 'Monza', 'R')
    laps = session.laps
    print(f"Extracted {len(laps)} laps from FastF1 API for Monza")

    # Extracted data summary
    summary = f"Extracted {len(laps)} laps from FastF1 API for Monza"
    return summary
          
    

