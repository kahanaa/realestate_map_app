# Google Street View Setup Instructions

## Current Implementation
The listings now use Google Street View Static API URLs in the format:
```
https://maps.googleapis.com/maps/api/streetview?size=400x300&location=LAT,LNG&fov=90&pitch=0
```

## To Enable Street View Images

### Option 1: Google Street View API (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Street View Static API"
4. Create credentials (API Key)
5. Set the API key as an environment variable:
   ```bash
   export GOOGLE_MAPS_API_KEY="your_api_key_here"
   ```
6. Update the URLs to include the key:
   ```
   https://maps.googleapis.com/maps/api/streetview?size=400x300&location=LAT,LNG&fov=90&pitch=0&key=YOUR_API_KEY
   ```

### Option 2: Alternative Street View Services
- **Mapillary**: Free, no API key required
- **OpenStreetView**: Open source alternative
- **Bing Streetside**: Microsoft's street view service

### Option 3: Custom Street View Images
You can replace the URLs with your own hosted images or use a different image service.

## Cost Considerations
- Google Street View API has usage limits and costs
- Free tier: 25,000 requests per month
- After free tier: $7.00 per 1,000 requests

## Current Status
The application is configured to use Google Street View URLs but will show broken images without an API key. The URLs are correctly formatted and will work once authentication is added.
