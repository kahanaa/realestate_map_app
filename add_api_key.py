#!/usr/bin/env python3
import json
import os

def add_api_key_to_streetview():
    """Add Google Maps API key to all Street View URLs"""
    
    # Get API key from environment variable
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    
    if not api_key:
        print("Error: GOOGLE_MAPS_API_KEY environment variable not set")
        print("Please set it with: export GOOGLE_MAPS_API_KEY='your_key_here'")
        return
    
    # Read current listings
    with open('backend/listings_seed.json', 'r') as f:
        listings = json.load(f)
    
    # Update each listing's image_url to include the API key
    updated_count = 0
    for listing in listings:
        if 'image_url' in listing and 'maps.googleapis.com' in listing['image_url']:
            if '&key=' not in listing['image_url']:
                listing['image_url'] += f'&key={api_key}'
                updated_count += 1
    
    # Write back to file
    with open('backend/listings_seed.json', 'w') as f:
        json.dump(listings, f, indent=4)
    
    print(f"Successfully added API key to {updated_count} Street View URLs")
    print("Street View images should now work in the application!")

if __name__ == "__main__":
    add_api_key_to_streetview()
